namespace SqlH1.Api.Models;

public class ModuleCatalogItem
{
    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public int Order { get; set; }
    public bool ScaffoldOnly { get; set; }
    public string[] Objectives { get; set; } = [];
}

public class ContentItem
{
    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string Module { get; set; } = "";
    public int Order { get; set; }
    public string Kind { get; set; } = "theory";
    public string[] Objectives { get; set; } = [];
    public string Markdown { get; set; } = "";
    public string Html { get; set; } = "";
    public SandboxMeta? Sandbox { get; set; }
}

public class SandboxMeta
{
    public string? Seed { get; set; }
    public bool AllowWrite { get; set; }
    public string? ChecksPath { get; set; }
    public string? StarterSql { get; set; }
}

public class ExerciseCheckFile
{
    public string? Description { get; set; }
    public List<ExerciseAssertion> Assertions { get; set; } = [];
}

public class ExerciseAssertion
{
    public string Type { get; set; } = "sql_equals";
    public string? Sql { get; set; }
    public List<List<object?>>? Expected { get; set; }
    public string? Message { get; set; }
}

public class ExecuteRequest
{
    public string Sql { get; set; } = "";
    public string? ContentSlug { get; set; }
    public bool? AllowWrite { get; set; }
}

public class ResultSet
{
    public string Label { get; set; } = "";
    public string[] Columns { get; set; } = [];
    public List<object?[]> Rows { get; set; } = [];
    public int? RowsAffected { get; set; }
    public bool Truncated { get; set; }
}

public class ExecuteResult
{
    public bool Ok { get; set; }
    public string[] Columns { get; set; } = [];
    public List<object?[]> Rows { get; set; } = [];
    public int? RowsAffected { get; set; }
    public string? Error { get; set; }
    public bool Truncated { get; set; }
    public List<ResultSet> Sets { get; set; } = [];
}

public class CheckRequest
{
    public string ContentSlug { get; set; } = "";
}

public class CheckResult
{
    public bool Passed { get; set; }
    public List<string> Messages { get; set; } = [];
}

public class ProgressUpsertRequest
{
    public int PartIndex { get; set; }
    public string Status { get; set; } = "started";
    public object? Payload { get; set; }
}

public class MeResponse
{
    public Guid Sub { get; set; }
    public string DisplayName { get; set; } = "";
    public string? Email { get; set; }
    public SandboxStatusDto Sandbox { get; set; } = new();
}

public class SandboxStatusDto
{
    public string Status { get; set; } = "none";
    public string? DbName { get; set; }
}

public class InspectColumnDto
{
    public string Name { get; set; } = "";
    public string DataType { get; set; } = "";
    public bool Nullable { get; set; }
    public bool IsPrimaryKey { get; set; }
    public bool IsForeignKey { get; set; }
}

public class InspectRelationDto
{
    public string FromTable { get; set; } = "";
    public string FromColumn { get; set; } = "";
    public string ToTable { get; set; } = "";
    public string ToColumn { get; set; } = "";
}

public class InspectTableDto
{
    public string Name { get; set; } = "";
    public List<InspectColumnDto> Columns { get; set; } = [];
    public long RowCount { get; set; }
    public long? BaselineRowCount { get; set; }
    /// <summary>unchanged | changed | extra | missing</summary>
    public string DiffStatus { get; set; } = "unchanged";
    public string[] PreviewColumns { get; set; } = [];
    public List<object?[]> PreviewRows { get; set; } = [];
    public bool PreviewTruncated { get; set; }
    public string[]? AddedColumns { get; set; }
    public List<object?[]>? AddedRows { get; set; }
    public string[]? RemovedColumns { get; set; }
    public List<object?[]>? RemovedRows { get; set; }
}

public class InspectResult
{
    public string DbName { get; set; } = "";
    public string Status { get; set; } = "ready";
    public string BaselineLabel { get; set; } = "Start-seed";
    public bool MatchesBaseline { get; set; }
    public List<InspectTableDto> Tables { get; set; } = [];
    public List<string> BaselineOnlyTables { get; set; } = [];
    public List<InspectRelationDto> Relations { get; set; } = [];
}

public class QueryHistoryDto
{
    public long Id { get; set; }
    public string Sql { get; set; } = "";
    public string? ContentSlug { get; set; }
    public bool Ok { get; set; }
    public string? Error { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
