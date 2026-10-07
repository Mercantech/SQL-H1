namespace SqlH1.Api.Models;

public class AppUser
{
    public Guid Sub { get; set; }
    public string DisplayName { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class StudentDatabase
{
    public Guid UserSub { get; set; }
    public string DbName { get; set; } = "";
    public string DbRole { get; set; } = "";
    public string DbPassword { get; set; } = "";
    public string Status { get; set; } = "pending";
    public DateTimeOffset? ProvisionedAt { get; set; }
    public AppUser? User { get; set; }
}

public class ProgressEntry
{
    public long Id { get; set; }
    public Guid UserSub { get; set; }
    public string ContentSlug { get; set; } = "";
    public int PartIndex { get; set; }
    public string Status { get; set; } = "started";
    public string? PayloadJson { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public AppUser? User { get; set; }
}
