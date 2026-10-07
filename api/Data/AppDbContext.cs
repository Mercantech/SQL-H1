using Microsoft.EntityFrameworkCore;
using SqlH1.Api.Models;

namespace SqlH1.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<StudentDatabase> StudentDatabases => Set<StudentDatabase>();
    public DbSet<ProgressEntry> Progress => Set<ProgressEntry>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Sub);
            e.Property(x => x.Sub).HasColumnName("sub");
            e.Property(x => x.DisplayName).HasColumnName("display_name").HasMaxLength(200);
            e.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<StudentDatabase>(e =>
        {
            e.ToTable("student_databases");
            e.HasKey(x => x.UserSub);
            e.Property(x => x.UserSub).HasColumnName("user_sub");
            e.Property(x => x.DbName).HasColumnName("db_name").HasMaxLength(63);
            e.Property(x => x.DbRole).HasColumnName("db_role").HasMaxLength(63);
            e.Property(x => x.DbPassword).HasColumnName("db_password").HasMaxLength(128);
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(32);
            e.Property(x => x.ProvisionedAt).HasColumnName("provisioned_at");
            e.HasOne(x => x.User).WithOne().HasForeignKey<StudentDatabase>(x => x.UserSub);
        });

        modelBuilder.Entity<ProgressEntry>(e =>
        {
            e.ToTable("progress");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id");
            e.Property(x => x.UserSub).HasColumnName("user_sub");
            e.Property(x => x.ContentSlug).HasColumnName("content_slug").HasMaxLength(200);
            e.Property(x => x.PartIndex).HasColumnName("part_index");
            e.Property(x => x.Status).HasColumnName("status").HasMaxLength(32);
            e.Property(x => x.PayloadJson).HasColumnName("payload_json").HasColumnType("jsonb");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            e.HasIndex(x => new { x.UserSub, x.ContentSlug, x.PartIndex }).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserSub);
        });
    }
}
