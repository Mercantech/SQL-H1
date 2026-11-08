namespace GameHub.CodeFirst;

public sealed class Tournament
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string GameTitle { get; set; } = "";
    public int MaxPlayers { get; set; }
    public DateTime StartsAtUtc { get; set; }
    public List<Registration> Registrations { get; set; } = [];
}

public sealed class Registration
{
    public int Id { get; set; }
    public int TournamentId { get; set; }
    public Tournament Tournament { get; set; } = null!;
    public string PlayerTag { get; set; } = "";
    public DateTime JoinedAtUtc { get; set; }
}
