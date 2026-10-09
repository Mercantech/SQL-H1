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
        var sets = new List<ResultSet>();
        ExecuteResult? last = null;
        var selectIndex = 0;
        foreach (var stmt in statements)
        {
            last = await RunOneAsync(conn, stmt, ct);
            if (!last.Ok)
            {
                last.Sets = sets;
                return last;
            }

            if (last.Columns.Length > 0)
            {
                selectIndex++;
                sets.Add(new ResultSet
                {
                    Label = $"SELECT {selectIndex}",
                    Columns = last.Columns,
                    Rows = last.Rows,
                    Truncated = last.Truncated
                });
            }
            else if (last.RowsAffected is not null && statements.Count == 1)
            {
                sets.Add(new ResultSet
                {
                    Label = "Resultat",
                    RowsAffected = last.RowsAffected
                });
            }
        }

        var primary = sets.LastOrDefault(s => s.Columns.Length > 0) ?? sets.LastOrDefault();
        return new ExecuteResult
        {
            Ok = true,
            Columns = primary?.Columns ?? [],
            Rows = primary?.Rows ?? [],
            RowsAffected = primary?.RowsAffected ?? last?.RowsAffected,
            Truncated = primary?.Truncated ?? false,
            Sets = sets
        };
    }

    public async Task ResetAsync(Guid userSub, string? contentSlug, CancellationToken ct = default)
    {
        var studentDb = await EnsureProvisionedAsync(userSub, ct);
        await ApplySeedAsync(studentDb, contentSlug, ct);
    }

    public async Task<InspectResult> InspectAsync(Guid userSub, string? contentSlug, CancellationToken ct = default)
    {
        var studentDb = await EnsureProvisionedAsync(userSub, ct);
        await using var conn = new NpgsqlConnection(StudentConnection(studentDb));
        await conn.OpenAsync(ct);

        const string refSchema = "_sqlh1_ref";
        var seedSql = ResolveSeedSql(contentSlug);
        var baselineLabel = string.IsNullOrWhiteSpace(contentSlug) ? "Café-start (shop)" : $"Seed: {contentSlug}";

        try
        {
            await using (var drop = new NpgsqlCommand($"DROP SCHEMA IF EXISTS {refSchema} CASCADE; CREATE SCHEMA {refSchema};", conn))
                await drop.ExecuteNonQueryAsync(ct);

            var body = StripSchemaBootstrap(seedSql);
            await using (var path = new NpgsqlCommand($"SET search_path TO {refSchema}", conn))
                await path.ExecuteNonQueryAsync(ct);
            await using (var seed = new NpgsqlCommand(body, conn))
                await seed.ExecuteNonQueryAsync(ct);
            await using (var path = new NpgsqlCommand("SET search_path TO public", conn))
                await path.ExecuteNonQueryAsync(ct);

            var publicTables = await ListTablesAsync(conn, "public", ct);
            var baselineTables = await ListTablesAsync(conn, refSchema, ct);
            var relations = await ListForeignKeysAsync(conn, "public", ct);
            var fkColumns = relations
                .Select(r => (r.FromTable, r.FromColumn))
                .ToHashSet();
            var result = new InspectResult
            {
                DbName = studentDb.DbName,
                Status = studentDb.Status,
                BaselineLabel = baselineLabel,
                BaselineOnlyTables = baselineTables.Where(t => !publicTables.Contains(t)).OrderBy(t => t).ToList(),
                Relations = relations
            };

            foreach (var table in publicTables.OrderBy(t => t))
            {
                if (!IsSafeIdent(table)) continue;
                var columns = await ListColumnsAsync(conn, "public", table, ct);
                foreach (var col in columns)
                    col.IsForeignKey = fkColumns.Contains((table, col.Name));
                var rowCount = await CountRowsAsync(conn, "public", table, ct);
                long? baselineCount = null;
                var diffStatus = "extra";
                string[]? addedCols = null;
                List<object?[]>? addedRows = null;
                string[]? removedCols = null;
                List<object?[]>? removedRows = null;

                if (baselineTables.Contains(table))
                {
                    baselineCount = await CountRowsAsync(conn, refSchema, table, ct);
                    var (added, removed) = await DiffRowsAsync(conn, table, refSchema, ct);
                    addedCols = added.Columns;
                    addedRows = added.Rows;
                    removedCols = removed.Columns;
                    removedRows = removed.Rows;
                    var sameCount = rowCount == baselineCount;
                    var noRowDiff = added.Rows.Count == 0 && removed.Rows.Count == 0;
                    diffStatus = sameCount && noRowDiff ? "unchanged" : "changed";
                }

                var preview = await PreviewAsync(conn, "public", table, 40, ct);
                result.Tables.Add(new InspectTableDto
                {
                    Name = table,
                    Columns = columns,
                    RowCount = rowCount,
                    BaselineRowCount = baselineCount,
                    DiffStatus = diffStatus,
                    PreviewColumns = preview.Columns,
                    PreviewRows = preview.Rows,
                    PreviewTruncated = preview.Truncated,
                    AddedColumns = addedCols,
                    AddedRows = addedRows,
                    RemovedColumns = removedCols,
                    RemovedRows = removedRows
                });
            }

            result.MatchesBaseline = result.Tables.All(t => t.DiffStatus == "unchanged")
                                     && result.BaselineOnlyTables.Count == 0;
            return result;
        }
        finally
        {
            try
            {
                await using var cleanup = new NpgsqlCommand($"DROP SCHEMA IF EXISTS {refSchema} CASCADE; SET search_path TO public;", conn);
                await cleanup.ExecuteNonQueryAsync(ct);
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Kunne ikke rydde {Schema}", refSchema);
            }
        }
    }

    private string ResolveSeedSql(string? contentSlug)
    {
        if (!string.IsNullOrWhiteSpace(contentSlug))
        {
            var item = content.GetContent(contentSlug);
            var fromItem = item is null ? null : content.ReadSeedSql(item);
            if (!string.IsNullOrWhiteSpace(fromItem))
                return fromItem;
        }

        var shop = content.ReadSeedFile("seeds/shop.sql");
        if (!string.IsNullOrWhiteSpace(shop))
            return shop;

        return """
            DROP SCHEMA public CASCADE;
            CREATE SCHEMA public;
            GRANT ALL ON SCHEMA public TO PUBLIC;
            """ + "\n" + DefaultShopSeed();
    }

    private async Task ApplySeedAsync(StudentDatabase studentDb, string? contentSlug, CancellationToken ct)
    {
        var seedSql = ResolveSeedSql(contentSlug);
        await using var conn = new NpgsqlConnection(StudentConnection(studentDb));
        await conn.OpenAsync(ct);
        await using var cmd = new NpgsqlCommand(seedSql, conn);
        await cmd.ExecuteNonQueryAsync(ct);
    }

    private static string StripSchemaBootstrap(string seedSql)
    {
        var lines = seedSql.Split('\n');
        var kept = new List<string>();
        foreach (var line in lines)
        {
            var t = line.TrimStart();
            if (t.StartsWith("DROP SCHEMA", StringComparison.OrdinalIgnoreCase)) continue;
            if (t.StartsWith("CREATE SCHEMA", StringComparison.OrdinalIgnoreCase)) continue;
            if (t.StartsWith("GRANT ALL ON SCHEMA", StringComparison.OrdinalIgnoreCase)) continue;
            kept.Add(line);
        }
        return string.Join('\n', kept);
    }

    private static bool IsSafeIdent(string name) =>
        System.Text.RegularExpressions.Regex.IsMatch(name, @"^[a-zA-Z_][a-zA-Z0-9_]*$");

    private static async Task<List<string>> ListTablesAsync(NpgsqlConnection conn, string schema, CancellationToken ct)
    {
        await using var cmd = new NpgsqlCommand(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = @s AND table_type = 'BASE TABLE'
            ORDER BY table_name
            """, conn);
        cmd.Parameters.AddWithValue("s", schema);
        var list = new List<string>();
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
            list.Add(reader.GetString(0));
        return list;
    }

    private static async Task<List<InspectColumnDto>> ListColumnsAsync(
        NpgsqlConnection conn, string schema, string table, CancellationToken ct)
    {
        await using var cmd = new NpgsqlCommand(
            """
            SELECT c.column_name, c.data_type, c.is_nullable,
                   EXISTS (
                     SELECT 1
                     FROM information_schema.table_constraints tc
                     JOIN information_schema.key_column_usage kcu
                       ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                     WHERE tc.table_schema = c.table_schema
                       AND tc.table_name = c.table_name
                       AND kcu.column_name = c.column_name
                       AND tc.constraint_type = 'PRIMARY KEY'
                   ) AS is_pk
            FROM information_schema.columns c
            WHERE c.table_schema = @s AND c.table_name = @t
            ORDER BY c.ordinal_position
            """, conn);
        cmd.Parameters.AddWithValue("s", schema);
        cmd.Parameters.AddWithValue("t", table);
        var list = new List<InspectColumnDto>();
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(new InspectColumnDto
            {
                Name = reader.GetString(0),
                DataType = reader.GetString(1),
                Nullable = reader.GetString(2) == "YES",
                IsPrimaryKey = reader.GetBoolean(3)
            });
        }
        return list;
    }

    private static async Task<List<InspectRelationDto>> ListForeignKeysAsync(
        NpgsqlConnection conn, string schema, CancellationToken ct)
    {
        await using var cmd = new NpgsqlCommand(
            """
            SELECT
              kcu.table_name AS from_table,
              kcu.column_name AS from_column,
              ccu.table_name AS to_table,
              ccu.column_name AS to_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name
             AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
              ON ccu.constraint_name = tc.constraint_name
             AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_schema = @s
            ORDER BY from_table, from_column
            """, conn);
        cmd.Parameters.AddWithValue("s", schema);
        var list = new List<InspectRelationDto>();
        await using var reader = await cmd.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct))
        {
            list.Add(new InspectRelationDto
            {
                FromTable = reader.GetString(0),
                FromColumn = reader.GetString(1),
                ToTable = reader.GetString(2),
                ToColumn = reader.GetString(3)
            });
        }
        return list;
    }

    private static async Task<long> CountRowsAsync(NpgsqlConnection conn, string schema, string table, CancellationToken ct)
    {
        await using var cmd = new NpgsqlCommand($"SELECT COUNT(*)::bigint FROM {schema}.\"{table}\"", conn);
        var val = await cmd.ExecuteScalarAsync(ct);
        return val is long l ? l : Convert.ToInt64(val);
    }

    private async Task<(ExecuteResult Added, ExecuteResult Removed)> DiffRowsAsync(
        NpgsqlConnection conn, string table, string refSchema, CancellationToken ct)
    {
        var added = await RunOneAsync(conn,
            $"""SELECT * FROM public."{table}" EXCEPT SELECT * FROM {refSchema}."{table}" LIMIT 30""", ct);
        var removed = await RunOneAsync(conn,
            $"""SELECT * FROM {refSchema}."{table}" EXCEPT SELECT * FROM public."{table}" LIMIT 30""", ct);
        return (added, removed);
    }

    private async Task<(string[] Columns, List<object?[]> Rows, bool Truncated)> PreviewAsync(
        NpgsqlConnection conn, string schema, string table, int limit, CancellationToken ct)
    {
        var result = await RunOneAsync(conn, $"""SELECT * FROM {schema}."{table}" LIMIT {limit + 1}""", ct);
        if (!result.Ok)
            return ([], [], false);
        var truncated = result.Rows.Count > limit;
        var rows = truncated ? result.Rows.Take(limit).ToList() : result.Rows;
        return (result.Columns, rows, truncated);
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
          customer_id INT REFERENCES customers(id),
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
          (4, 4, 1, '2024-04-05'),
          (4, 2, 2, '2024-04-06'),
          (NULL, 1, 1, '2024-04-12'),
          (NULL, 3, 2, '2024-04-13');
        """;
}

