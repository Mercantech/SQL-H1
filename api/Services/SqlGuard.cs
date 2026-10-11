using System.Text;
using System.Text.RegularExpressions;

namespace SqlH1.Api.Services;

public static class SqlGuard
{
    /// <summary>
    /// Cluster-/host-farlige kommandoer. Elev har egen DB og må gerne DDL/DCL på egne objekter.
    /// </summary>
    private static readonly Regex Banned = new(
        @"\b(DROP\s+DATABASE|CREATE\s+DATABASE|CREATE\s+ROLE|ALTER\s+ROLE|DROP\s+ROLE|CREATE\s+USER|ALTER\s+USER|DROP\s+USER|COPY\s+|pg_read_file|pg_write_file|lo_import|lo_export|ALTER\s+SYSTEM|SET\s+ROLE|RESET\s+ROLE|CREATE\s+EXTENSION|ALTER\s+EXTENSION|DROP\s+EXTENSION|CREATE\s+TABLESPACE)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    private static readonly Regex AllowedStart = new(
        @"^\s*(WITH|SELECT|INSERT|UPDATE|DELETE|EXPLAIN|CREATE|ALTER|DROP|TRUNCATE|COMMENT|ANALYZE|VACUUM|GRANT|REVOKE|DO|CALL|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE|REINDEX)\b",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled);

    /// <summary>Kræver allowWrite (ændrer data/skema/rettigheder eller transaktion).</summary>
    private static readonly Regex RequiresWrite = new(
        @"^\s*(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE|GRANT|REVOKE|DO|CALL|COMMENT|VACUUM|REINDEX|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)\b",
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
                return "Kommandoen er ikke tilladt. Du må bl.a. bruge SELECT, DML, DDL (CREATE/ALTER/DROP), VIEW, FUNCTION, TRIGGER, GRANT og EXPLAIN.";

            if (!allowWrite && RequiresWrite.IsMatch(stmt))
                return "Skrivende SQL / DDL er ikke tilladt i denne opgave. Brug SELECT (eller Nulstil / skift lektion med skrivning).";
        }

        return null;
    }

    public static List<string> SplitStatements(string sql)
    {
        var cleaned = StripComments(sql);
        var parts = new List<string>();
        var current = new StringBuilder();
        var inSingle = false;
        string? dollarTag = null;

        for (var i = 0; i < cleaned.Length; i++)
        {
            var ch = cleaned[i];

            if (dollarTag is not null)
            {
                if (StartsWithAt(cleaned, i, dollarTag))
                {
                    current.Append(dollarTag);
                    i += dollarTag.Length - 1;
                    dollarTag = null;
                }
                else
                {
                    current.Append(ch);
                }
                continue;
            }

            if (!inSingle && ch == '$')
            {
                var tag = TryReadDollarTag(cleaned, i);
                if (tag is not null)
                {
                    dollarTag = tag;
                    current.Append(tag);
                    i += tag.Length - 1;
                    continue;
                }
            }

            if (ch == '\'')
            {
                current.Append(ch);
                if (inSingle)
                {
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
    /// Fjerner -- linjekommentarer og /* */ blokke uden for strenge og dollar-quotes,
    /// så fx "ORDER BY x; -- tip" ikke bliver til en ekstra sætning.
    /// </summary>
    internal static string StripComments(string sql)
    {
        var sb = new StringBuilder(sql.Length);
        var inSingle = false;
        string? dollarTag = null;

        for (var i = 0; i < sql.Length; i++)
        {
            var ch = sql[i];
            var next = i + 1 < sql.Length ? sql[i + 1] : '\0';

            if (dollarTag is not null)
            {
                if (StartsWithAt(sql, i, dollarTag))
                {
                    sb.Append(dollarTag);
                    i += dollarTag.Length - 1;
                    dollarTag = null;
                }
                else
                {
                    sb.Append(ch);
                }
                continue;
            }

            if (!inSingle && ch == '$')
            {
                var tag = TryReadDollarTag(sql, i);
                if (tag is not null)
                {
                    dollarTag = tag;
                    sb.Append(tag);
                    i += tag.Length - 1;
                    continue;
                }
            }

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

    /// <summary>Læs $tag$ fra position i (inkl. tom $$).</summary>
    private static string? TryReadDollarTag(string sql, int start)
    {
        if (start >= sql.Length || sql[start] != '$')
            return null;

        var j = start + 1;
        while (j < sql.Length)
        {
            var c = sql[j];
            if (c == '$')
                return sql.Substring(start, j - start + 1);
            if (!(char.IsLetterOrDigit(c) || c == '_'))
                return null;
            j++;
        }

        return null;
    }

    private static bool StartsWithAt(string sql, int index, string value)
    {
        if (index + value.Length > sql.Length)
            return false;
        return string.Compare(sql, index, value, 0, value.Length, StringComparison.Ordinal) == 0;
    }
}
