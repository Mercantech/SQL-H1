using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using OptionFactory = Microsoft.Extensions.Options.Options;
using Npgsql;
using SqlH1.Api.Data;
using SqlH1.Api.Models;
using SqlH1.Api.Options;
using SqlH1.Api.Services;

namespace SqlH1.Api.Tests;

// Run with --exercises and TEACH_TEST_CONNECTION pointing to a dedicated local
// PostgreSQL database named teach_checks_test. It must allow student provisioning.
internal static class ExerciseGradingTests
{
    public static async Task<int> Run(string contentRoot)
    {
        var connection = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("TEACH_TEST_CONNECTION"));
        if (connection.Database != "teach_checks_test" || connection.Host is not ("localhost" or "127.0.0.1"))
            throw new InvalidOperationException("Use a local teach_checks_test database for --exercises.");

        var user = Guid.NewGuid();
        await using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseNpgsql(connection.ToString()).Options);
        await db.Database.EnsureCreatedAsync();
        db.Users.Add(new AppUser { Sub = user, DisplayName = "Grading regression" });
        await db.SaveChangesAsync();
        var content = new ContentService(OptionFactory.Create(new ContentOptions { RootPath = contentRoot }));
        var service = new SandboxService(db, content, OptionFactory.Create(new SandboxOptions
        {
            AdminConnectionString = connection.ToString(), PostgresHost = connection.Host!, PostgresPort = connection.Port
        }), NullLogger<SandboxService>.Instance);
        var fixtureRoot = Path.GetFullPath(Path.Combine(contentRoot, "..", "api.tests", "solutions"));
        var failed = 0;
        var exercises = content.GetModules().SelectMany(m => content.GetModuleContents(m.Slug)).Where(i => i.Kind == "exercise").ToList();
        try
        {
            foreach (var exercise in exercises)
            {
                try
                {
                    await service.ResetAsync(user, exercise.Slug);
                    var request = new CheckRequest { ContentSlug = exercise.Slug };
                    var initial = await service.CheckAsync(user, request);
                    Require(!initial.Passed, "Untouched seed and missing answers passed");
                    var checks = content.LoadChecks(exercise)!.Assertions;
                    var parts = content.GetAnswerParts(exercise).ToList();

                    Require(parts.All(p => p.Label == "Del " + p.Id.Split('-')[1]), "Answer label revealed the solution");
                    if (parts.Count > 0)
                    {
                        request.Answers = parts.Select(p => new StudentAnswer(p.Id, "SELECT 'forkert'")).ToList();
                        var incorrect = await service.CheckAsync(user, request);
                        Require(!incorrect.Passed && incorrect.Parts.Count == checks.Count, "Incorrect result passed or missing feedback");
                        request.Answers = checks.Select((a, i) => (a, i))
                            .Where(p => p.a.NeedsAnswer(exercise))
                            .Select(p => new StudentAnswer($"part-{p.i + 1}", p.a.Sql!)).ToList();
                    }
                    if (exercise.Sandbox!.AllowWrite)
                    {
                        var solution = await File.ReadAllTextAsync(Path.Combine(fixtureRoot, exercise.Slug + ".sql"));
                        var incomplete = exercise.Slug switch
                        {
                            "views-ex-01" => solution.Replace("LEFT JOIN customers", "INNER JOIN customers"),
                            "procedures-ex-01" => "CREATE FUNCTION order_line_total(p_order_id int) RETURNS numeric LANGUAGE sql AS $$ SELECT 0::numeric $$",
                            "procedures-ex-02" => "CREATE FUNCTION require_positive(p_n int) RETURNS int LANGUAGE sql AS $$ SELECT p_n $$",
                            _ => string.Join(";\n", SqlGuard.SplitStatements(solution).SkipLast(1))
                        };
                        var wrong = await service.ExecuteAsync(user, new ExecuteRequest { ContentSlug = exercise.Slug, Sql = incomplete });
                        Require(wrong.Ok, "Invalid test fixture for a partial solution: " + wrong.Error);
                        Require(!(await service.CheckAsync(user, request)).Passed, "A partial solution satisfied the exercise");
                        await service.ResetAsync(user, exercise.Slug);
                        var executed = await service.ExecuteAsync(user, new ExecuteRequest { ContentSlug = exercise.Slug, Sql = solution });
                        Require(executed.Ok, "Fixture execution: " + executed.Error);
                    }
                    var valid = await service.CheckAsync(user, request);
                    Require(valid.Passed && valid.Parts.All(p => p.Passed), string.Join(" | ", valid.Parts.Where(p => !p.Passed).Select(p => p.Message)));
                    Require((await service.CheckAsync(user, request)).Passed, "Checking twice changed the result");
                    await service.UpsertProgressAsync(user, exercise.Slug, 0, "started", null);
                    Require(await service.HasPassedAsync(user, exercise.Slug, 0), "Revisiting lost a pass");
                    Console.WriteLine($"PASS {exercise.Slug} ({checks.Count} checks)");
                }
                catch (Exception ex)
                {
                    failed++;
                    Console.Error.WriteLine($"FAIL {exercise.Slug}: {ex.Message}");
                }
            }
            await service.ResetAsync(user, "select-ex-01");
            var cases = content.LoadChecks(content.GetContent("select-ex-01")!)!.Assertions;
            var alternative = new CheckRequest { ContentSlug = "select-ex-01", Answers =
            [
                new("part-1", "SELECT name, city FROM customers WHERE city IN ('Viborg') ORDER BY name"),
                new("part-2", "SELECT name, price FROM products WHERE category = 'Mad' ORDER BY name DESC"),
                new("part-3", cases[2].Sql!)
            ] };
            Require((await service.CheckAsync(user, alternative)).Passed, "Equivalent unordered answer or NULL was rejected");
            alternative.Answers[0] = new("part-1", "SELECT name, city FROM customers WHERE city = 'Viborg' ORDER BY name DESC");
            var partial = await service.CheckAsync(user, alternative);
            Require(!partial.Passed && partial.Parts.Count(p => p.Passed) == 2, "Required ordering or partial feedback incorrect");
            alternative.Answers[1] = new("part-2", "SELECT name, price FROM products CROSS JOIN generate_series(1, 2) WHERE name = 'Sandwich'");
            Require(!(await service.CheckAsync(user, alternative)).Parts[1].Passed, "Mistaken duplicate accepted");
            var returning = await service.ExecuteAsync(user, new ExecuteRequest
            {
                ContentSlug = "dml-ex-04",
                Sql = "UPDATE products SET price = 45.00 WHERE name = 'Smoothie' RETURNING name, price"
            });
            Require(returning.Ok && returning.Columns.SequenceEqual(["name", "price"]) &&
                returning.Rows.Count == 1 && Equals(returning.Rows[0][1], 45m), "RETURNING did not show the changed row");
            var restricted = await service.ExecuteAsync(user, new ExecuteRequest
            {
                ContentSlug = "adonet-ex-01", AllowWrite = false, Sql = "UPDATE products SET price = 50 WHERE name = 'Smoothie'"
            });
            Require(!restricted.Ok, "A read-only preview modified a writable exercise");
            var mark = await service.ExecuteAsync(user, new ExecuteRequest { Sql = "CREATE TABLE preserved (id integer)", AllowWrite = true });
            Require(mark.Ok, "Could not create session marker");
            await service.EnsureProvisionedAsync(user);
            var marker = await service.ExecuteAsync(user, new ExecuteRequest { Sql = "SELECT COUNT(*) FROM preserved" });
            Require(marker.Ok, "Provisioning erased an existing database");
            await service.UpsertProgressAsync(user, "orm-project-01", 0, "completed", null);
            await service.UpsertProgressAsync(user, "orm-project-01", 0, "started", null);
            Require(!await service.HasPassedAsync(user, "orm-project-01", 0), "Project could not be reopened");
            Console.WriteLine($"{exercises.Count - failed}/{exercises.Count} exercises passed. Checked column names, order, NULL, duplicates, RETURNING, read-only preview, progress and repeat provisioning.");
        }
        finally
        {
            var (name, role) = SandboxService.NamesFor(user);
            await using var admin = new NpgsqlConnection(connection.ToString());
            await admin.OpenAsync();
            await using var cleanup = new NpgsqlCommand($"DROP DATABASE IF EXISTS \"{name}\" WITH (FORCE)", admin);
            await cleanup.ExecuteNonQueryAsync();
            cleanup.CommandText = $"DROP ROLE IF EXISTS \"{role}\"";
            await cleanup.ExecuteNonQueryAsync();
            await db.Users.Where(u => u.Sub == user).ExecuteDeleteAsync();
        }
        return failed == 0 ? 0 : 1;
    }

    private static void Require(bool condition, string message)
    {
        if (!condition) throw new InvalidOperationException(message);
    }
}
