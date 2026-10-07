using System.Text.RegularExpressions;

namespace SqlH1.Api.Services;

public static class SqlGuard
{
    private static readonly Regex Banned = new(
        @"\b(DROP\s+DATABASE|CREATE\s+DATABASE|CREATE\s+ROLE|ALTER\s+ROLE|DROP\s+ROLE|GRANT\s+|REVOKE\s+|COPY\s+|pg_read_file|pg_write_file|lo_import|lo_export|ALTER\s+SYSTEM|SET\s+ROLE|RESET\s+ROLE)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex AllowedStart = new(
        @"^\s*(WITH|SELECT|INSERT|UPDATE|DELETE|EXPLAIN)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public static string? Validate(string sql, bool allowWrite)
    {
        if (string.IsNullOrWhiteSpace(sql))
            return "SQL må ikke være tom.";

        if (sql.Length > 20_000)
            return "SQL er for langt (max 20.000 tegn).";

        if (Banned.IsMatch(sql))
            return "Kommandoen er ikke tilladt i sandboxen (sikkerhedsbegrænsning).";

        var statements = SplitStatements(sql);
        if (statements.Count == 0)
            return "Ingen gyldig SQL-sætning fundet.";

        foreach (var stmt in statements)
        {
            if (!AllowedStart.IsMatch(stmt))
                return "Kun SELECT, INSERT, UPDATE, DELETE og WITH er tilladt i MVP.";

            if (!allowWrite && Regex.IsMatch(stmt, @"^\s*(INSERT|UPDATE|DELETE)\b", RegexOptions.IgnoreCase))
                return "Skrivende SQL er ikke tilladt i denne opgave. Brug SELECT.";
        }

        return null;
    }

    public static List<string> SplitStatements(string sql)
    {
        var parts = sql.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return parts.Where(p => !string.IsNullOrWhiteSpace(p)).ToList();
    }
}
