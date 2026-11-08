using GameHub.CodeFirst;
using Microsoft.EntityFrameworkCore;

await using var db = new GameHubContextFactory().CreateDbContext([]);
var game = args.ElementAtOrDefault(1) ?? "Counter-Strike 2";
var report = db.Tournaments
    .AsNoTracking()
    .Where(t => t.GameTitle == game)
    .OrderBy(t => t.StartsAtUtc)
    .Select(t => new
    {
        t.Id,
        t.Title,
        t.MaxPlayers,
        SignedUp = t.Registrations.Count,
        SpotsLeft = t.MaxPlayers - t.Registrations.Count
    });

if (args.FirstOrDefault() == "sql")
{
    // ToQueryString oversætter uden at åbne en forbindelse. Ingen credentials logges.
    Console.WriteLine(report.ToQueryString());
    return;
}

var appliedMigrations = await db.Database.GetAppliedMigrationsAsync();
if (!appliedMigrations.Any())
{
    Console.Error.WriteLine("Der mangler en migration. Følg README: migrations add InitialGameHub og database update.");
    Environment.ExitCode = 1;
    return;
}

// Gentagelig start-demo. Egne tilføjelser skal fortsat kunne ses ved næste kørsel.
if (!await db.Tournaments.AnyAsync())
{
    db.Tournaments.AddRange(
        new Tournament
        {
            Title = "Fredagsfinalen", GameTitle = "Counter-Strike 2", MaxPlayers = 10,
            StartsAtUtc = new DateTime(2030, 5, 10, 18, 0, 0, DateTimeKind.Utc),
            Registrations =
            [
                new() { PlayerTag = "Raymond", JoinedAtUtc = new DateTime(2030, 5, 1, 12, 0, 0, DateTimeKind.Utc) },
                new() { PlayerTag = "NullPointer", JoinedAtUtc = new DateTime(2030, 5, 1, 12, 5, 0, DateTimeKind.Utc) }
            ]
        },
        new Tournament
        {
            Title = "Natteholdets revanche", GameTitle = "Counter-Strike 2", MaxPlayers = 10,
            StartsAtUtc = new DateTime(2030, 5, 11, 18, 0, 0, DateTimeKind.Utc)
        },
        new Tournament
        {
            Title = "Boost og bolde", GameTitle = "Rocket League", MaxPlayers = 16,
            StartsAtUtc = new DateTime(2030, 5, 12, 18, 0, 0, DateTimeKind.Utc),
            Registrations =
            [new() { PlayerTag = "LittleBobbyTables", JoinedAtUtc = new DateTime(2030, 5, 1, 12, 10, 0, DateTimeKind.Utc) }]
        });
    await db.SaveChangesAsync();
}

Console.WriteLine($"GameHub: {await db.Tournaments.CountAsync()} turneringer, {await db.Registrations.CountAsync()} tilmeldinger");
Console.WriteLine($"Rapport for {game}:");
foreach (var row in await report.ToListAsync())
    Console.WriteLine($"{row.Title} | {row.SignedUp}/{row.MaxPlayers} tilmeldte | {row.SpotsLeft} ledige");
