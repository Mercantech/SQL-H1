namespace SqlH1.Api.Options;

public class AuthOptions
{
    public const string Section = "Auth";
    public string Issuer { get; set; } = "https://auth.mercantec.tech";
    public string Audience { get; set; } = "mercantec-apps";
    public string JwksUri { get; set; } = "https://auth.mercantec.tech/.well-known/jwks.json";
}

public class ContentOptions
{
    public const string Section = "Content";
    public string RootPath { get; set; } = "content";
}

public class SandboxOptions
{
    public const string Section = "Sandbox";
    public string AdminConnectionString { get; set; } = "";
    public string PostgresHost { get; set; } = "db";
    public int PostgresPort { get; set; } = 5432;
    public int StatementTimeoutSeconds { get; set; } = 5;
    public int MaxRows { get; set; } = 200;
}
