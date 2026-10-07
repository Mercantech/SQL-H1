using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Npgsql;
using SqlH1.Api.Data;
using SqlH1.Api.Models;
using SqlH1.Api.Options;

namespace SqlH1.Api.Services;

public class SandboxService(
    AppDbContext db,
    ContentService content,
    IOptions<SandboxOptions> options,
    ILogger<SandboxService> logger)
{
    private readonly SandboxOptions _opt = options.Value;

    public async Task<StudentDatabase> EnsureProvisionedAsync(Guid userSub, CancellationToken ct = default)
    {
        var existing = await db.StudentDatabases.FirstOrDefaultAsync(x => x.UserSub == userSub, ct);
        if (existing is { Status: "ready" })
            return existing;

        var (dbName, role) = NamesFor(userSub);
        var password = existing?.DbPassword;
        if (string.IsNullOrEmpty(password))
            password = Convert.ToBase64String(RandomNumberGenerator.GetBytes(24))
                .Replace('+', 'x').Replace('/', 'y').TrimEnd('=');

        await using var admin = new NpgsqlConnection(AdminConnection());
        await admin.OpenAsync(ct);

        var wasReady = existing is { Status: "ready" };
        await EnsureRoleAndDatabaseAsync(admin, dbName, role, password, ct);

        if (existing is null)
        {
            existing = new StudentDatabase
            {
                UserSub = userSub,
                DbName = dbName,
                DbRole = role,
                DbPassword = password,
                Status = "ready",
                ProvisionedAt = DateTimeOffset.UtcNow
            };
            db.StudentDatabases.Add(existing);
        }
        else
        {
            existing.DbName = dbName;
            existing.DbRole = role;
            existing.DbPassword = password;
            existing.Status = "ready";
            existing.ProvisionedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);

        if (!wasReady)
            await ApplySeedAsync(existing, null, ct);

        return existing;
    }

    public async Task<ExecuteResult> ExecuteAsync(Guid userSub, ExecuteRequest request, CancellationToken ct = default)
    {
        var studentDb = await EnsureProvisionedAsync(userSub, ct);
        var allowWrite = request.AllowWrite ?? false;
        ContentItem? item = null;
        if (!string.IsNullOrWhiteSpace(request.ContentSlug))
        {
            item = content.GetContent(request.ContentSlug);
            if (item?.Sandbox is not null)
                allowWrite = item.Sandbox.AllowWrite;
        }

        var guardError = SqlGuard.Validate(request.Sql, allowWrite);
        if (guardError is not null)
            return new ExecuteResult { Ok = false, Error = guardError };

        await using var conn = new NpgsqlConnection(StudentConnection(studentDb));
        await conn.OpenAsync(ct);
        await using (var timeoutCmd = new NpgsqlCommand(
                         $"SET statement_timeout = '{_opt.StatementTimeoutSeconds}s'", conn))
        {
            await timeoutCmd.ExecuteNonQueryAsync(ct);
        }

        var statements = SqlGuard.SplitStatements(request.Sql);
        ExecuteResult? last = null;
        foreach (var stmt in statements)
        {
            last = await RunOneAsync(conn, stmt, ct);
            if (!last.Ok) return last;
        }

        return last ?? new ExecuteResult { Ok = true };
    }

    public async Task ResetAsync(Guid userSub, string? contentSlug, CancellationToken ct = default)
    {
        var studentDb = await EnsureProvisionedAsync(userSub, ct);
        await ApplySeedAsync(studentDb, contentSlug, ct);
    }

    private async Task ApplySeedAsync(StudentDatabase studentDb, string? contentSlug, CancellationToken ct)
    {
        string seedSql;
        if (!string.IsNullOrWhiteSpace(contentSlug))
        {
            var item = content.GetContent(contentSlug);
            var fromItem = item is null ? null : content.ReadSeedSql(item);
            seedSql = !string.IsNullOrWhiteSpace(fromItem)
                ? fromItem
                : """
                  DROP SCHEMA public CASCADE;
                  CREATE SCHEMA public;
                  GRANT ALL ON SCHEMA public TO PUBLIC;
                  """ + "\n" + DefaultShopSeed();
        }
        else
        {
            seedSql = """
                DROP SCHEMA public CASCADE;
                CREATE SCHEMA public;
                GRANT ALL ON SCHEMA public TO PUBLIC;
                """ + "\n" + DefaultShopSeed();
        }

        await using var conn = new NpgsqlConnection(StudentConnection(studentDb));
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(seedSql, conn);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    public async Task<CheckResult> CheckAsync(Guid userSub, string contentSlug, CancellationToken ct = default)
    {
        var item = content.GetContent(contentSlug);
        if (item is null)
            return new CheckResult { Passed = false, Messages = ["Opgave ikke fundet."] };

        var checks = content.LoadChecks(item);
        if (checks is null || checks.Assertions.Count == 0)
            return new CheckResult { Passed = false, Messages = ["Ingen checks defineret for denne opgave."] };

        var studentDb = await EnsureProvisionedAsync(userSub, ct);
        await using var conn = new NpgsqlConnection(StudentConnection(studentDb));
        await conn.OpenAsync(ct);

        var messages = new List<string>();
        var passed = true;
        foreach (var assertion in checks.Assertions)
        {
            if (assertion.Type != "sql_equals" || string.IsNullOrWhiteSpace(assertion.Sql))
            {
                messages.Add(assertion.Message ?? "Ukendt assertion-type.");
                passed = false;
                continue;
            }

            var result = await RunOneAsync(conn, assertion.Sql, ct);
            if (!result.Ok)
            {
                messages.Add(assertion.Message ?? $"Check fejlede: {result.Error}");
                passed = false;
                continue;
            }

            var expected = assertion.Expected ?? [];
            if (!RowsEqual(result, expected))
            {
                messages.Add(assertion.Message ?? "Resultatet matcher ikke det forventede.");
                passed = false;
            }
            else
            {
                messages.Add(assertion.Message ?? "OK");
            }
        }

        if (passed)
        {
            await UpsertProgressAsync(userSub, contentSlug, 0, "completed", null, ct);
        }

        return new CheckResult { Passed = passed, Messages = messages };
    }

    public async Task UpsertProgressAsync(
        Guid userSub,
        string slug,
        int partIndex,
        string status,
        object? payload,
        CancellationToken ct = default)
    {
        var entry = await db.Progress.FirstOrDefaultAsync(
            x => x.UserSub == userSub && x.ContentSlug == slug && x.PartIndex == partIndex, ct);

        var json = payload is null ? null : JsonSerializer.Serialize(payload);
        if (entry is null)
        {
            db.Progress.Add(new ProgressEntry
            {
                UserSub = userSub,
                ContentSlug = slug,
                PartIndex = partIndex,
                Status = status,
                PayloadJson = json,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        }
        else
        {
            entry.Status = status;
            entry.PayloadJson = json;
            entry.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task EnsureRoleAndDatabaseAsync(
        NpgsqlConnection admin,
        string dbName,
        string role,
        string password,
        CancellationToken ct)
    {
        await using (var roleExists = new NpgsqlCommand(
                         "SELECT 1 FROM pg_roles WHERE rolname = @r", admin))
        {
            roleExists.Parameters.AddWithValue("r", role);
            var exists = await roleExists.ExecuteScalarAsync(ct) is not null;
            if (!exists)
            {
                await using var createRole = new NpgsqlCommand(
                    $"""CREATE ROLE "{role}" LOGIN PASSWORD '{EscapeLiteral(password)}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT""",
                    admin);
                await createRole.ExecuteNonQueryAsync(ct);
            }
            else
            {
                await using var alter = new NpgsqlCommand(
                    $"""ALTER ROLE "{role}" WITH LOGIN PASSWORD '{EscapeLiteral(password)}'""",
                    admin);
                await alter.ExecuteNonQueryAsync(ct);
            }
        }

        await using (var dbExists = new NpgsqlCommand(
                         "SELECT 1 FROM pg_database WHERE datname = @d", admin))
        {
            dbExists.Parameters.AddWithValue("d", dbName);
            var exists = await dbExists.ExecuteScalarAsync(ct) is not null;
            if (!exists)
            {
                await using var createDb = new NpgsqlCommand(
                    $"""CREATE DATABASE "{dbName}" OWNER "{role}" """,
                    admin);
                await createDb.ExecuteNonQueryAsync(ct);
            }
        }

        // Revoke connect on platform DB from student role (best effort)
        try
        {
            await using var revoke = new NpgsqlCommand(
                $"""REVOKE CONNECT ON DATABASE sqlh1 FROM "{role}" """, admin);
            await revoke.ExecuteNonQueryAsync(ct);
        }
        catch (Exception ex)
        {
            logger.LogDebug(ex, "Kunne ikke revoke CONNECT på sqlh1 for {Role}", role);
        }
    }

    private async Task<ExecuteResult> RunOneAsync(NpgsqlConnection conn, string sql, CancellationToken ct)
    {
        try
        {
            await using var cmd = new NpgsqlCommand(sql, conn);
            var isQuery = RegexStartsWithSelectOrWith(sql);

            if (!isQuery)
            {
                var affected = await cmd.ExecuteNonQueryAsync(ct);
                return new ExecuteResult { Ok = true, RowsAffected = affected };
            }

            await using var reader = await cmd.ExecuteReaderAsync(ct);
            var columns = Enumerable.Range(0, reader.FieldCount).Select(reader.GetName).ToArray();
            var rows = new List<object?[]>();
            var truncated = false;
            while (await reader.ReadAsync(ct))
            {
                if (rows.Count >= _opt.MaxRows)
                {
                    truncated = true;
                    break;
                }

                var row = new object?[reader.FieldCount];
                for (var i = 0; i < reader.FieldCount; i++)
                    row[i] = reader.IsDBNull(i) ? null : Normalize(reader.GetValue(i));
                rows.Add(row);
            }

            return new ExecuteResult
            {
                Ok = true,
                Columns = columns,
                Rows = rows,
                Truncated = truncated
            };
        }
        catch (PostgresException ex)
        {
            return new ExecuteResult
            {
                Ok = false,
                Error = $"{ex.SqlState}: {ex.MessageText}"
            };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Sandbox execute failed");
            return new ExecuteResult { Ok = false, Error = ex.Message };
        }
    }

    private static bool RowsEqual(ExecuteResult actual, List<List<object?>> expected)
    {
        if (actual.Rows.Count != expected.Count) return false;
        for (var r = 0; r < expected.Count; r++)
        {
            var exp = expected[r];
            var act = actual.Rows[r];
            if (exp.Count != act.Length) return false;
            for (var c = 0; c < exp.Count; c++)
            {
                if (!CellEqual(exp[c], act[c])) return false;
            }
        }

        return true;
    }

    private static bool CellEqual(object? a, object? b)
    {
        if (a is null && b is null) return true;
        if (a is null || b is null) return false;
        if (a is JsonElement jeA) a = JsonElementToObject(jeA);
        if (b is JsonElement jeB) b = JsonElementToObject(jeB);
        if (TryToDecimal(a, out var da) && TryToDecimal(b, out var db))
            return da == db;
        return string.Equals(
            Convert.ToString(a, System.Globalization.CultureInfo.InvariantCulture),
            Convert.ToString(b, System.Globalization.CultureInfo.InvariantCulture),
            StringComparison.Ordinal);
    }

    private static bool TryToDecimal(object? value, out decimal d)
    {
        switch (value)
        {
            case decimal dec:
                d = dec;
                return true;
            case int i:
                d = i;
                return true;
            case long l:
                d = l;
                return true;
            case double dbl:
                d = (decimal)dbl;
                return true;
            case float f:
                d = (decimal)f;
                return true;
            case string s when decimal.TryParse(s, System.Globalization.NumberStyles.Any,
                System.Globalization.CultureInfo.InvariantCulture, out var parsed):
                d = parsed;
                return true;
            default:
                d = 0;
                return false;
        }
    }

    private static object? JsonElementToObject(JsonElement je) => je.ValueKind switch
    {
        JsonValueKind.String => je.GetString(),
        JsonValueKind.Number => je.TryGetInt64(out var l) ? l : je.GetDouble(),
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        JsonValueKind.Null => null,
        _ => je.ToString()
    };

    private static object? Normalize(object value) => value switch
    {
        DateTime dt => dt.ToString("O"),
        DateTimeOffset dto => dto.ToString("O"),
        decimal d => d,
        _ => value
    };

    private static bool RegexStartsWithSelectOrWith(string sql) =>
        System.Text.RegularExpressions.Regex.IsMatch(
            sql.TrimStart(),
            @"^(WITH|SELECT|EXPLAIN)\b",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    public static (string DbName, string Role) NamesFor(Guid sub)
    {
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(sub.ToString("N"))))
            .ToLowerInvariant()[..16];
        var name = $"s_{hash}";
        return (name, name);
    }

    private string AdminConnection()
    {
        if (!string.IsNullOrWhiteSpace(_opt.AdminConnectionString))
            return _opt.AdminConnectionString;
        return $"Host={_opt.PostgresHost};Port={_opt.PostgresPort};Database=postgres;Username=sqlh1;Password=sqlh1";
    }

    private string StudentConnection(StudentDatabase student) =>
        $"Host={_opt.PostgresHost};Port={_opt.PostgresPort};Database={student.DbName};Username={student.DbRole};Password={student.DbPassword}";

    private static string EscapeLiteral(string value) => value.Replace("'", "''");

    public static string DefaultShopSeed() => """
        CREATE TABLE customers (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          city TEXT NOT NULL,
          created_at DATE NOT NULL DEFAULT CURRENT_DATE
        );

        CREATE TABLE products (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          price NUMERIC(10,2) NOT NULL
        );

        CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          customer_id INT NOT NULL REFERENCES customers(id),
          product_id INT NOT NULL REFERENCES products(id),
          quantity INT NOT NULL,
          order_date DATE NOT NULL
        );

        INSERT INTO customers (name, city, created_at) VALUES
          ('Anna Jensen', 'Viborg', '2024-01-10'),
          ('Bo Nielsen', 'Aarhus', '2024-02-15'),
          ('Clara Holm', 'Viborg', '2024-03-01'),
          ('David Lund', 'Aalborg', '2024-03-20');

        INSERT INTO products (name, category, price) VALUES
          ('Espresso', 'Drikke', 28.00),
          ('Latte', 'Drikke', 35.00),
          ('Croissant', 'Bagværk', 22.50),
          ('Sandwich', 'Mad', 48.00),
          ('Te', 'Drikke', 25.00);

        INSERT INTO orders (customer_id, product_id, quantity, order_date) VALUES
          (1, 1, 2, '2024-04-01'),
          (1, 3, 1, '2024-04-02'),
          (2, 2, 1, '2024-04-02'),
          (2, 4, 2, '2024-04-03'),
          (3, 5, 3, '2024-04-04'),
          (3, 1, 1, '2024-04-05'),
          (4, 4, 1, '2024-04-05'),
          (4, 2, 2, '2024-04-06');
        """;
}
