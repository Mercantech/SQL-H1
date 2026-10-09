using System.Text;
using System.Text.RegularExpressions;
using SqlH1.Api.Models;

namespace SqlH1.Api.Services;

public static partial class SeedSchemaParser
{
    public static SeedSchemaDto? Parse(string? seedSql)
    {
        if (string.IsNullOrWhiteSpace(seedSql)) return null;

        var tables = new List<SchemaTableDto>();
        var relations = new List<SchemaRelationDto>();
        var ddlParts = new List<string>();

        foreach (var block in ExtractCreateTableBlocks(seedSql))
        {
            ddlParts.Add(block.Sql.Trim());
            var table = ParseCreateTable(block.Name, block.Body);
            if (table is null) continue;
            tables.Add(table);
            foreach (var col in table.Columns.Where(c => c.ReferencesTable is not null))
            {
                relations.Add(new SchemaRelationDto
                {
                    FromTable = table.Name,
                    FromColumn = col.Name,
                    ToTable = col.ReferencesTable!,
                    ToColumn = col.ReferencesColumn ?? "id"
                });
            }
        }

        if (tables.Count == 0) return null;

        return new SeedSchemaDto
        {
            Ddl = string.Join("\n\n", ddlParts),
            Tables = tables,
            Relations = relations
        };
    }

    private static IEnumerable<(string Name, string Body, string Sql)> ExtractCreateTableBlocks(string sql)
    {
        var text = sql;
        var idx = 0;
        while (idx < text.Length)
        {
            var match = CreateTableHeaderRegex().Match(text, idx);
            if (!match.Success) yield break;

            var name = match.Groups["name"].Value;
            var open = match.Index + match.Length - 1; // '('
            var close = FindMatchingParen(text, open);
            if (close < 0) yield break;

            var end = close + 1;
            while (end < text.Length && char.IsWhiteSpace(text[end])) end++;
            if (end < text.Length && text[end] == ';') end++;

            var full = text[match.Index..end].Trim();
            var body = text[(open + 1)..close];
            yield return (name, body, full);
            idx = end;
        }
    }

    private static int FindMatchingParen(string text, int openIndex)
    {
        var depth = 0;
        for (var i = openIndex; i < text.Length; i++)
        {
            var c = text[i];
            if (c == '(') depth++;
            else if (c == ')')
            {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    private static SchemaTableDto? ParseCreateTable(string name, string body)
    {
        var columns = new List<SchemaColumnDto>();
        foreach (var raw in SplitTopLevelCommas(body))
        {
            var line = raw.Trim().TrimEnd(',');
            if (line.Length == 0) continue;
            if (line.StartsWith("CONSTRAINT", StringComparison.OrdinalIgnoreCase)) continue;
            if (line.StartsWith("PRIMARY KEY", StringComparison.OrdinalIgnoreCase))
            {
                var pkCols = ExtractParenList(line);
                foreach (var pk in pkCols)
                {
                    var col = columns.FirstOrDefault(c =>
                        c.Name.Equals(pk, StringComparison.OrdinalIgnoreCase));
                    if (col is not null) col.IsPrimaryKey = true;
                }
                continue;
            }
            if (line.StartsWith("FOREIGN KEY", StringComparison.OrdinalIgnoreCase) ||
                line.StartsWith("UNIQUE", StringComparison.OrdinalIgnoreCase) ||
                line.StartsWith("CHECK", StringComparison.OrdinalIgnoreCase))
                continue;

            var colMatch = ColumnStartRegex().Match(line);
            if (!colMatch.Success) continue;

            var colName = colMatch.Groups["name"].Value;
            var rest = line[colMatch.Length..].Trim();
            var typeMatch = TypeRegex().Match(rest);
            var dataType = typeMatch.Success ? typeMatch.Value.Trim() : rest.Split(' ', 2)[0];

            var upper = rest.ToUpperInvariant();
            var nullable = !upper.Contains("NOT NULL") && !upper.Contains("PRIMARY KEY");
            var isPk = upper.Contains("PRIMARY KEY");
            string? refTable = null;
            string? refCol = null;
            var refMatch = ReferencesRegex().Match(rest);
            if (refMatch.Success)
            {
                refTable = refMatch.Groups["table"].Value;
                refCol = refMatch.Groups["column"].Success
                    ? refMatch.Groups["column"].Value
                    : "id";
            }

            columns.Add(new SchemaColumnDto
            {
                Name = colName,
                DataType = NormalizeType(dataType),
                Nullable = nullable && !isPk,
                IsPrimaryKey = isPk,
                IsForeignKey = refTable is not null,
                ReferencesTable = refTable,
                ReferencesColumn = refCol
            });
        }

        return columns.Count == 0
            ? null
            : new SchemaTableDto { Name = name, Columns = columns };
    }

    private static IEnumerable<string> SplitTopLevelCommas(string body)
    {
        var sb = new StringBuilder();
        var depth = 0;
        foreach (var c in body)
        {
            if (c == '(') depth++;
            else if (c == ')') depth = Math.Max(0, depth - 1);

            if (c == ',' && depth == 0)
            {
                yield return sb.ToString();
                sb.Clear();
                continue;
            }
            sb.Append(c);
        }
        if (sb.Length > 0) yield return sb.ToString();
    }

    private static IEnumerable<string> ExtractParenList(string line)
    {
        var open = line.IndexOf('(');
        var close = line.LastIndexOf(')');
        if (open < 0 || close <= open) yield break;
        foreach (var part in line[(open + 1)..close].Split(','))
        {
            var name = part.Trim().Trim('"');
            if (name.Length > 0) yield return name;
        }
    }

    private static string NormalizeType(string type) =>
        type.Replace("  ", " ", StringComparison.Ordinal).Trim();

    [GeneratedRegex(@"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?<name>[a-zA-Z_][\w]*)\s*\(",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CreateTableHeaderRegex();

    [GeneratedRegex(@"^(?:""(?<name>[^""]+)""|(?<name>[a-zA-Z_][\w]*))\s+",
        RegexOptions.CultureInvariant)]
    private static partial Regex ColumnStartRegex();

    [GeneratedRegex(@"^[a-zA-Z_][\w]*(?:\s*\([^)]*\))?", RegexOptions.CultureInvariant)]
    private static partial Regex TypeRegex();

    [GeneratedRegex(@"REFERENCES\s+(?<table>[a-zA-Z_][\w]*)\s*(?:\(\s*(?<column>[a-zA-Z_][\w]*)\s*\))?",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex ReferencesRegex();
}
