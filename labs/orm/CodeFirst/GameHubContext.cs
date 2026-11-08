using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace GameHub.CodeFirst;

public sealed class GameHubContext(DbContextOptions<GameHubContext> options) : DbContext(options)
{
    public DbSet<Tournament> Tournaments => Set<Tournament>();
    public DbSet<Registration> Registrations => Set<Registration>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Tournament>(entity =>
        {
            entity.ToTable("tournaments", table => table.HasCheckConstraint("ck_tournament_capacity", "\"MaxPlayers\" > 0"));
            entity.Property(t => t.Title).HasMaxLength(100).IsRequired();
            entity.Property(t => t.GameTitle).HasMaxLength(80).IsRequired();
        });

        modelBuilder.Entity<Registration>(entity =>
        {
            entity.ToTable("registrations");
            entity.Property(r => r.PlayerTag).HasMaxLength(40).IsRequired();
            entity.HasIndex(r => new { r.TournamentId, r.PlayerTag }).IsUnique();
            entity.HasOne(r => r.Tournament)
                .WithMany(t => t.Registrations)
                .HasForeignKey(r => r.TournamentId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}

public sealed class GameHubContextFactory : IDesignTimeDbContextFactory<GameHubContext>
{
    public GameHubContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("CODEFIRST_CONNECTION_STRING")
            ?? throw new InvalidOperationException("CODEFIRST_CONNECTION_STRING mangler. Kør gennem workshop-servicen i Compose.");
        return new GameHubContext(new DbContextOptionsBuilder<GameHubContext>()
            .UseNpgsql(connectionString)
            .Options);
    }
}
