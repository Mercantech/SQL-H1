using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SqlH1.Api.Data;
using SqlH1.Api.Models;

namespace SqlH1.Api.Services;

public class UserService(AppDbContext db)
{
    public static Guid? GetSub(ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue("sub") ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out var g) ? g : null;
    }

    public static string GetDisplayName(ClaimsPrincipal user)
    {
        return user.FindFirstValue("name")
               ?? user.FindFirstValue("preferred_username")
               ?? user.FindFirstValue(ClaimTypes.Name)
               ?? user.FindFirstValue("email")
               ?? "Elev";
    }

    public static string? GetEmail(ClaimsPrincipal user) =>
        user.FindFirstValue("email") ?? user.FindFirstValue(ClaimTypes.Email);

    public async Task<AppUser> EnsureUserAsync(ClaimsPrincipal principal, CancellationToken ct = default)
    {
        var sub = GetSub(principal) ?? throw new UnauthorizedAccessException("Mangler sub i token.");
        var existing = await db.Users.FirstOrDefaultAsync(x => x.Sub == sub, ct);
        if (existing is not null)
        {
            var name = GetDisplayName(principal);
            if (!string.IsNullOrWhiteSpace(name) && existing.DisplayName != name)
            {
                existing.DisplayName = name;
                await db.SaveChangesAsync(ct);
            }

            return existing;
        }

        var created = new AppUser
        {
            Sub = sub,
            DisplayName = GetDisplayName(principal),
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.Users.Add(created);
        await db.SaveChangesAsync(ct);
        return created;
    }
}
