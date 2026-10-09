using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SqlH1.Api.Data;
using SqlH1.Api.Models;
using SqlH1.Api.Options;
using SqlH1.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var authIssuer = Environment.GetEnvironmentVariable("AUTH_ISSUER")
                 ?? builder.Configuration["Auth:Issuer"]
                 ?? "https://auth.mercantec.tech";
var authAudience = Environment.GetEnvironmentVariable("AUTH_AUDIENCE")
                   ?? builder.Configuration["Auth:Audience"]
                   ?? "mercantec-apps";
var jwksUri = Environment.GetEnvironmentVariable("JWKS_URI")
              ?? builder.Configuration["Auth:JwksUri"]
              ?? "https://auth.mercantec.tech/.well-known/jwks.json";
var corsOrigin = Environment.GetEnvironmentVariable("CORS_ORIGIN")
                 ?? builder.Configuration["Cors:Origins"]
                 ?? "http://localhost:5173,http://localhost:3000";
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
                  ?? builder.Configuration.GetConnectionString("Platform")
                  ?? "Host=localhost;Port=5432;Database=sqlh1;Username=sqlh1;Password=sqlh1";
var contentRoot = Environment.GetEnvironmentVariable("CONTENT_ROOT")
                  ?? builder.Configuration["Content:RootPath"]
                  ?? Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "content"));
var adminConnRaw = Environment.GetEnvironmentVariable("ADMIN_DATABASE_URL")
                   ?? builder.Configuration["Sandbox:AdminConnectionString"]
                   ?? "Host=localhost;Port=5432;Database=postgres;Username=sqlh1;Password=sqlh1";
var platformCs = ToNpgsql(databaseUrl);
var adminCs = ToNpgsql(adminConnRaw);
var pgHost = Environment.GetEnvironmentVariable("POSTGRES_HOST")
             ?? (platformCs.Contains("Host=db") ? "db" : "localhost");
var pgPort = int.TryParse(Environment.GetEnvironmentVariable("POSTGRES_PORT"), out var p) ? p : 5432;

builder.Services.Configure<AuthOptions>(o =>
{
    o.Issuer = authIssuer;
    o.Audience = authAudience;
    o.JwksUri = jwksUri;
});
builder.Services.Configure<ContentOptions>(o => o.RootPath = contentRoot);
builder.Services.Configure<SandboxOptions>(o =>
{
    o.AdminConnectionString = adminCs;
    o.PostgresHost = pgHost;
    o.PostgresPort = pgPort;
});

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(platformCs));
builder.Services.AddSingleton<ContentService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<SandboxService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = authIssuer;
        options.Audience = authAudience;
        options.RequireHttpsMetadata = authIssuer.StartsWith("https://", StringComparison.OrdinalIgnoreCase);
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = authIssuer,
            ValidateAudience = true,
            ValidAudience = authAudience,
            ValidateLifetime = true,
            NameClaimType = "sub"
        };
        options.MetadataAddress = $"{authIssuer.TrimEnd('/')}/.well-known/openid-configuration";
        // Prefer explicit JWKS if metadata fails in some environments
        _ = jwksUri;
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = corsOrigin.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
    // EnsureCreated opdaterer ikke eksisterende DB — tilføj query_history eksplicit
    await db.Database.ExecuteSqlRawAsync(
        """
        CREATE TABLE IF NOT EXISTS query_history (
          id BIGSERIAL PRIMARY KEY,
          user_sub UUID NOT NULL REFERENCES users(sub) ON DELETE CASCADE,
          sql_text TEXT NOT NULL,
          content_slug VARCHAR(200),
          ok BOOLEAN NOT NULL DEFAULT FALSE,
          error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS ix_query_history_user_created
          ON query_history (user_sub, created_at DESC);
        """);
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Json(new { ok = true, service = "sqlh1-api" }));

api.MapPost("/auth/token", async (HttpRequest request) =>
{
    try
    {
        using var doc = await JsonDocument.ParseAsync(request.Body);
        var root = doc.RootElement;
        if (!root.TryGetProperty("grant_type", out _) || !root.TryGetProperty("client_id", out _))
            return Results.BadRequest(new { error = "invalid_request" });

        var form = new Dictionary<string, string>();
        foreach (var prop in root.EnumerateObject())
        {
            if (prop.Value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined) continue;
            form[prop.Name] = prop.Value.ValueKind == JsonValueKind.String
                ? prop.Value.GetString() ?? ""
                : prop.Value.ToString();
        }

        using var http = new HttpClient();
        using var content = new FormUrlEncodedContent(form);
        var upstream = await http.PostAsync($"{authIssuer.TrimEnd('/')}/oauth/token", content);
        var body = await upstream.Content.ReadAsStringAsync();
        return Results.Content(body, "application/json", statusCode: (int)upstream.StatusCode);
    }
    catch (Exception ex)
    {
        return Results.Json(new { error = "token_proxy_failed", error_description = ex.Message }, statusCode: 502);
    }
});

api.MapGet("/me", async (HttpContext ctx, UserService users, AppDbContext db) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    var sandbox = await db.StudentDatabases.FindAsync(user.Sub);
    return Results.Json(new MeResponse
    {
        Sub = user.Sub,
        DisplayName = user.DisplayName,
        Email = UserService.GetEmail(ctx.User),
        Sandbox = new SandboxStatusDto
        {
            Status = sandbox?.Status ?? "none",
            DbName = sandbox?.DbName
        }
    });
}).RequireAuthorization();

api.MapGet("/modules", (ContentService content) =>
{
    var modules = content.GetModules().Select(m => new
    {
        m.Slug,
        m.Title,
        m.Description,
        m.Order,
        m.ScaffoldOnly,
        m.Objectives,
        items = content.GetModuleContents(m.Slug).Select(i => new
        {
            i.Slug,
            i.Title,
            i.Kind,
            i.Order
        })
    });
    return Results.Json(modules);
});

api.MapGet("/content/{slug}", (string slug, ContentService content) =>
{
    var item = content.GetContent(slug);
    if (item is null) return Results.NotFound();

    // Schema-overblik til opgaver (og øvrigt indhold med seed)
    var schema = content.GetSeedSchema(item);

    return Results.Json(new
    {
        item.Slug,
        item.Title,
        item.Module,
        item.Order,
        item.Kind,
        item.Objectives,
        item.Markdown,
        item.Html,
        item.Sandbox,
        schema
    });
});

api.MapPost("/sandbox/provision", async (HttpContext ctx, UserService users, SandboxService sandbox) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    var db = await sandbox.EnsureProvisionedAsync(user.Sub);
    await sandbox.ResetAsync(user.Sub, null);
    return Results.Json(new { status = db.Status, dbName = db.DbName });
}).RequireAuthorization();

api.MapPost("/sandbox/execute", async (HttpContext ctx, UserService users, SandboxService sandbox, AppDbContext db, ExecuteRequest body) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    var result = await sandbox.ExecuteAsync(user.Sub, body);

    var sqlText = (body.Sql ?? "").Trim();
    if (sqlText.Length > 0)
    {
        if (sqlText.Length > 20_000) sqlText = sqlText[..20_000];
        db.QueryHistory.Add(new QueryHistoryEntry
        {
            UserSub = user.Sub,
            SqlText = sqlText,
            ContentSlug = string.IsNullOrWhiteSpace(body.ContentSlug) ? null : body.ContentSlug,
            Ok = result.Ok,
            Error = result.Error,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync();

        // Behold seneste 100 pr. bruger
        var oldIds = await db.QueryHistory
            .Where(x => x.UserSub == user.Sub)
            .OrderByDescending(x => x.CreatedAt)
            .Skip(100)
            .Select(x => x.Id)
            .ToListAsync();
        if (oldIds.Count > 0)
        {
            await db.QueryHistory.Where(x => oldIds.Contains(x.Id)).ExecuteDeleteAsync();
        }
    }

    return Results.Json(result);
}).RequireAuthorization();

api.MapGet("/sandbox/history", async (HttpContext ctx, UserService users, AppDbContext db, int? limit) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    var take = Math.Clamp(limit ?? 40, 1, 100);
    var rows = await db.QueryHistory
        .Where(x => x.UserSub == user.Sub)
        .OrderByDescending(x => x.CreatedAt)
        .Take(take)
        .Select(x => new QueryHistoryDto
        {
            Id = x.Id,
            Sql = x.SqlText,
            ContentSlug = x.ContentSlug,
            Ok = x.Ok,
            Error = x.Error,
            CreatedAt = x.CreatedAt
        })
        .ToListAsync();
    return Results.Json(rows);
}).RequireAuthorization();

api.MapDelete("/sandbox/history/{id:long}", async (long id, HttpContext ctx, UserService users, AppDbContext db) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    var row = await db.QueryHistory.FirstOrDefaultAsync(x => x.Id == id && x.UserSub == user.Sub);
    if (row is null) return Results.NotFound();
    db.QueryHistory.Remove(row);
    await db.SaveChangesAsync();
    return Results.Json(new { ok = true });
}).RequireAuthorization();

api.MapPost("/sandbox/reset", async (HttpContext ctx, UserService users, SandboxService sandbox, ResetBody? body) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    await sandbox.ResetAsync(user.Sub, body?.ContentSlug);
    return Results.Json(new { ok = true });
}).RequireAuthorization();

api.MapPost("/sandbox/check", async (HttpContext ctx, UserService users, SandboxService sandbox, CheckRequest body) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    var result = await sandbox.CheckAsync(user.Sub, body.ContentSlug);
    return Results.Json(result);
}).RequireAuthorization();

api.MapGet("/sandbox/inspect", async (HttpContext ctx, UserService users, SandboxService sandbox, string? contentSlug) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    var result = await sandbox.InspectAsync(user.Sub, contentSlug);
    return Results.Json(result);
}).RequireAuthorization();

api.MapGet("/progress", async (HttpContext ctx, UserService users, AppDbContext db) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    var rows = await db.Progress.Where(x => x.UserSub == user.Sub)
        .OrderByDescending(x => x.UpdatedAt)
        .Select(x => new { x.ContentSlug, x.PartIndex, x.Status, x.UpdatedAt })
        .ToListAsync();
    return Results.Json(rows);
}).RequireAuthorization();

api.MapGet("/progress/{slug}", async (string slug, HttpContext ctx, UserService users, AppDbContext db) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    var rows = await db.Progress.Where(x => x.UserSub == user.Sub && x.ContentSlug == slug)
        .Select(x => new { x.ContentSlug, x.PartIndex, x.Status, x.PayloadJson, x.UpdatedAt })
        .ToListAsync();
    return Results.Json(rows);
}).RequireAuthorization();

api.MapPut("/progress/{slug}", async (string slug, ProgressUpsertRequest body, HttpContext ctx, UserService users, SandboxService sandbox) =>
{
    var user = await users.EnsureUserAsync(ctx.User);
    await sandbox.UpsertProgressAsync(user.Sub, slug, body.PartIndex, body.Status, body.Payload);
    return Results.Json(new { ok = true });
}).RequireAuthorization();

var port = Environment.GetEnvironmentVariable("PORT") ?? "3001";
app.Urls.Clear();
app.Urls.Add($"http://0.0.0.0:{port}");
app.Run();

static string ToNpgsql(string url)
{
    if (!url.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
        && !url.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        return url;

    var uri = new Uri(url);
    var userInfo = uri.UserInfo.Split(':', 2);
    var user = Uri.UnescapeDataString(userInfo[0]);
    var pass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
    var db = uri.AbsolutePath.Trim('/');
    return $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={db};Username={user};Password={pass}";
}

record ResetBody(string? ContentSlug);
