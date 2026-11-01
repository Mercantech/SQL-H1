using System.Text.RegularExpressions;
using SqlH1.Api.Models;

namespace SqlH1.Api.Services;

/// <summary>Read-only retrieval of public course content; never reads exercise checks or seed rows.</summary>
public sealed class RaymondCurriculum(ContentService content)
{
    private static readonly Regex SlugPattern = new("^[a-z0-9]+(?:-[a-z0-9]+)*$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public ContentItem? FindLesson(string? slug)
    {
        if (string.IsNullOrWhiteSpace(slug) || slug.Length > 200 || !SlugPattern.IsMatch(slug)) return null;
        return content.GetContent(slug);
    }

    public object Catalog() => content.GetModules().Take(30).Select(module => new
    {
        slug = Limit(module.Slug, 200),
        title = Limit(module.Title, 200),
        description = Limit(module.Description, 400)
    }).ToArray();

    public IReadOnlyList<RaymondCurriculumMatch> Search(string query)
    {
        var words = Regex.Matches(Limit(query, 300).ToLowerInvariant(), @"[\p{L}\p{N}_]+")
            .Select(match => match.Value).Where(word => word.Length >= 2).Distinct().Take(12).ToArray();
        if (words.Length == 0) return [];

        return content.GetModules().SelectMany(module => content.GetModuleContents(module.Slug))
            .DistinctBy(item => item.Slug, StringComparer.OrdinalIgnoreCase)
            .Select(item => new { Item = item, Score = Score(item, words) })
            .Where(match => match.Score > 0)
            .OrderByDescending(match => match.Score).ThenBy(match => match.Item.Slug)
            .Take(5)
            .Select(match => new RaymondCurriculumMatch
            {
                Slug = Limit(match.Item.Slug, 200),
                Title = Limit(match.Item.Title, 200),
                Kind = match.Item.Kind,
                Excerpt = Excerpt(match.Item.Markdown, words)
            }).ToArray();
    }

    public object DescribeLesson(ContentItem item)
    {
        // Use parsed table/column metadata only. DDL, INSERT data and hidden assertion files are excluded.
        var schema = content.GetSeedSchema(item);
        return new
        {
            slug = Limit(item.Slug, 200),
            title = Limit(item.Title, 200),
            kind = Limit(item.Kind, 30),
            module = Limit(item.Module, 200),
            objectives = item.Objectives.Take(15).Select(objective => Limit(objective, 300)).ToArray(),
            markdown = Limit(item.Markdown, 14000),
            tables = schema?.Tables.Take(10).Select(table => new
            {
                name = Limit(table.Name, 120),
                columns = table.Columns.Take(25).Select(column => new
                {
                    name = Limit(column.Name, 120),
                    dataType = Limit(column.DataType, 80),
                    nullable = column.Nullable,
                    primaryKey = column.IsPrimaryKey,
                    referencesTable = Limit(column.ReferencesTable, 120),
                    referencesColumn = Limit(column.ReferencesColumn, 120)
                }).ToArray()
            }).ToArray(),
            relations = schema?.Relations.Take(30).Select(relation => new
            {
                fromTable = Limit(relation.FromTable, 120),
                fromColumn = Limit(relation.FromColumn, 120),
                toTable = Limit(relation.ToTable, 120),
                toColumn = Limit(relation.ToColumn, 120)
            }).ToArray()
        };
    }

    public static RaymondSource Source(ContentItem item) => new()
    {
        Slug = Limit(item.Slug, 200), Title = Limit(item.Title, 200), Kind = Limit(item.Kind, 30)
    };

    internal static string Limit(string? value, int maximum) =>
        string.IsNullOrEmpty(value) ? "" : value.Length <= maximum ? value : value[..maximum];

    private static int Score(ContentItem item, string[] words)
    {
        var score = 0;
        foreach (var word in words)
        {
            if (item.Title.Contains(word, StringComparison.OrdinalIgnoreCase)) score += 10;
            if (item.Slug.Contains(word, StringComparison.OrdinalIgnoreCase)) score += 6;
            if (item.Module.Contains(word, StringComparison.OrdinalIgnoreCase)) score += 4;
            if (item.Objectives.Any(objective => objective.Contains(word, StringComparison.OrdinalIgnoreCase))) score += 5;
            if (item.Markdown.Contains(word, StringComparison.OrdinalIgnoreCase)) score += 1;
        }
        return score;
    }

    private static string Excerpt(string markdown, string[] words)
    {
        var index = words.Select(word => markdown.IndexOf(word, StringComparison.OrdinalIgnoreCase))
            .Where(position => position >= 0).DefaultIfEmpty(0).Min();
        var start = Math.Max(0, index - 120);
        return Limit(markdown[start..], 650);
    }
}

public sealed class RaymondCurriculumMatch
{
    public string Slug { get; init; } = "";
    public string Title { get; init; } = "";
    public string Kind { get; init; } = "theory";
    public string Excerpt { get; init; } = "";
}
