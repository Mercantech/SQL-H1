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

public class ExecuteResult
{
    public bool Ok { get; set; }
    public string[] Columns { get; set; } = [];
    public List<object?[]> Rows { get; set; } = [];
    public int? RowsAffected { get; set; }
    public string? Error { get; set; }
    public bool Truncated { get; set; }
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
