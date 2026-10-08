using System.Text;
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
        var cleaned = StripComments(sql);
        var parts = new List<string>();
        var current = new StringBuilder();
        var inSingle = false;

        for (var i = 0; i < cleaned.Length; i++)
        {
            var ch = cleaned[i];

            if (ch == '\'')
            {
                current.Append(ch);
                if (inSingle)
                {
                    // Postgres escape: '' inside string
                    if (i + 1 < cleaned.Length && cleaned[i + 1] == '\'')
                    {
                        current.Append('\'');
                        i++;
                    }
                    else
                    {
                        inSingle = false;
                    }
                }
                else
                {
                    inSingle = true;
                }
                continue;
            }

            if (ch == ';' && !inSingle)
            {
                AddIfSql(parts, current.ToString());
                current.Clear();
                continue;
            }

            current.Append(ch);
        }

        AddIfSql(parts, current.ToString());
        return parts;
    }

    private static void AddIfSql(List<string> parts, string raw)
    {
        var stmt = raw.Trim();
        if (stmt.Length > 0)
            parts.Add(stmt);
    }

    /// <summary>
    /// Fjerner -- linjekommentarer og /* */ blokke uden for strenge,
    /// så fx "ORDER BY x; -- tip" ikke bliver til en ekstra sætning.
    /// </summary>
    internal static string StripComments(string sql)
    {
        var sb = new StringBuilder(sql.Length);
        var inSingle = false;

        for (var i = 0; i < sql.Length; i++)
        {
            var ch = sql[i];
            var next = i + 1 < sql.Length ? sql[i + 1] : '\0';

            if (!inSingle && ch == '-' && next == '-')
            {
                i += 2;
                while (i < sql.Length && sql[i] != '\n')
                    i++;
                if (i < sql.Length)
                    sb.Append('\n');
                continue;
            }

            if (!inSingle && ch == '/' && next == '*')
            {
                i += 2;
                while (i + 1 < sql.Length && !(sql[i] == '*' && sql[i + 1] == '/'))
                    i++;
                i++; // skip '/'
                sb.Append(' ');
                continue;
            }

            if (ch == '\'')
            {
                sb.Append(ch);
                if (inSingle)
                {
                    if (next == '\'')
                    {
                        sb.Append('\'');
                        i++;
                    }
                    else
                    {
                        inSingle = false;
                    }
                }
                else
                {
                    inSingle = true;
                }
                continue;
            }

            sb.Append(ch);
        }

        return sb.ToString();
    }
}
