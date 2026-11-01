namespace SqlH1.Api.Options;

public class RaymondOptions
{
    public const string Section = "Raymond";
    public string ApiKey { get; set; } = "";
    public string Model { get; set; } = "gpt-5.4-mini";
    public int MaxOutputTokens { get; set; } = 1800;
    public int TimeoutSeconds { get; set; } = 60;
}
