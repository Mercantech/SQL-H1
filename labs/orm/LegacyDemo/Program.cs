using GameHub.Legacy.Generated;
using Microsoft.EntityFrameworkCore;

var connectionString = Environment.GetEnvironmentVariable("LEGACY_CONNECTION_STRING")
    ?? throw new InvalidOperationException("LEGACY_CONNECTION_STRING mangler. Kør gennem Compose.");
var options = new DbContextOptionsBuilder<LegacyContext>().UseNpgsql(connectionString).Options;
await using var db = new LegacyContext(options);

var query = db.Set<Tournament>().AsNoTracking().OrderBy(t => t.Id);
if (args.FirstOrDefault() == "sql")
{
    Console.WriteLine(query.ToQueryString());
    return;
}

foreach (var tournament in await query.ToListAsync())
    Console.WriteLine($"{tournament.Id}: {tournament.DisplayName} | kapacitet {tournament.MaxPlayers}");

Console.WriteLine($"Registreringer: {await db.Set<Registration>().CountAsync()}");
