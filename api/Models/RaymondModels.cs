namespace SqlH1.Api.Models;

public class RaymondChatMessage
{
    public string Role { get; set; } = "user";
    public string Text { get; set; } = "";
}

public class RaymondChatRequest
{
    public string Message { get; set; } = "";
    public List<RaymondChatMessage> History { get; set; } = [];
    public string? ContentSlug { get; set; }
    public string? CurrentSql { get; set; }
    public string? LastError { get; set; }
    public string? ResultSummary { get; set; }
    public List<string>? CheckMessages { get; set; }
    public bool? CheckPassed { get; set; }
    public bool IncludeWork { get; set; } = true;
    public string? Path { get; set; }
}

public class RaymondSource
{
    public string Slug { get; set; } = "";
    public string Title { get; set; } = "";
    public string Kind { get; set; } = "theory";
}

public class RaymondContextSummary
{
    public string? LessonTitle { get; set; }
    public bool IncludesWork { get; set; }
    public int RecentQueries { get; set; }
}

public class RaymondChatResponse
{
    public string Reply { get; set; } = "";
    public List<RaymondSource> Sources { get; set; } = [];
    public RaymondContextSummary Context { get; set; } = new();
    public string Model { get; set; } = "";
}
