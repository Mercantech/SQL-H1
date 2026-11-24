using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;
using Npgsql;
using SqlH1.Api.Models;

namespace SqlH1.Api.Services;

public partial class SandboxService
{
    public async Task<CheckResult> CheckAsync(Guid userSub, CheckRequest request, CancellationToken ct = default)
    {
        var item = string.IsNullOrWhiteSpace(request.ContentSlug) ? null : content.GetContent(request.ContentSlug);
        var checks = item?.Kind == "exercise" ? content.LoadChecks(item) : null;
        if (item is null || checks is null || checks.Assertions.Count == 0)
            return new CheckResult { Messages = ["Denne side har ingen opgavekontrol."] };

        var answers = request.Answers ?? [];
        var answerIds = content.GetAnswerParts(item).Select(p => p.Id).ToHashSet();
        if (answers.Count > answerIds.Count || answers.Any(a => a is null || !answerIds.Contains(a.PartId))
            || answers.Select(a => a.PartId).Distinct().Count() != answers.Count)
            return new CheckResult { Messages = ["Besvarelsen indeholder en ukendt eller gentagen del. Genindlæs opgaven."] };

        var byPart = answers.ToDictionary(a => a.PartId, a => a.Sql);
        var studentDb = await EnsureProvisionedAsync(userSub, ct);
        await using var conn = new NpgsqlConnection(StudentConnection(studentDb));
        await conn.OpenAsync(ct);
        var result = new CheckResult();
        for (int i = 0; i < checks.Assertions.Count; i++)
        {
            var assertion = checks.Assertions[i];
            var id = $"part-{i + 1}";
            var feedback = await CheckPartAsync(conn, assertion, i + 1, assertion.NeedsAnswer(item), byPart.GetValueOrDefault(id), ct);
            result.Parts.Add(feedback);
            result.Messages.Add($"{(feedback.Passed ? "Bestået" : "Prøv igen")} · {feedback.Message}");
        }

        result.Passed = result.Parts.All(p => p.Passed);
        if (result.Passed)
            await UpsertProgressAsync(userSub, item.Slug, 0, "completed", null, ct);
        return result;
    }

    private async Task<PartFeedback> CheckPartAsync(NpgsqlConnection conn, ExerciseAssertion assertion,
        int number, bool needsAnswer, string? answer, CancellationToken ct)
    {
        var id = $"part-{number}";
        var label = assertion.Message ?? $"Del {number}";
        var prompt = needsAnswer ? $"Del {number}" : label;
        PartFeedback Fail(string reason) => new(id, false, $"{prompt} — {reason}");
        var sql = assertion.Sql;
        if (needsAnswer)
        {
            if (string.IsNullOrWhiteSpace(answer)) return Fail("Skriv din forespørgsel i svarfeltet.");
            var validation = SqlGuard.Validate(answer, allowWrite: false);
            if (validation is not null) return Fail(validation);
            var statements = SqlGuard.SplitStatements(answer);
            if (statements.Count != 1 || !Regex.IsMatch(statements[0], @"^(SELECT|WITH)\b", RegexOptions.IgnoreCase))
                return Fail("Besvar denne del med én læseforespørgsel.");
            sql = statements[0];
        }
        if (string.IsNullOrWhiteSpace(sql) || assertion.Type is not ("sql_equals" or "answer_equals" or "sql_errors"))
            return Fail("Kontrollen mangler en gyldig definition.");

        await using var transaction = await conn.BeginTransactionAsync(ct);
        if (needsAnswer)
        {
            await using var readOnly = new NpgsqlCommand("SET TRANSACTION READ ONLY", conn, transaction);
            await readOnly.ExecuteNonQueryAsync(ct);
        }
        await using var limit = new NpgsqlCommand($"SET LOCAL statement_timeout = '{_opt.StatementTimeoutSeconds}s'", conn, transaction);
        await limit.ExecuteNonQueryAsync(ct);
        var observed = await RunOneAsync(conn, sql, ct);
        await transaction.RollbackAsync(ct);

        if (assertion.Type == "sql_errors")
            return !observed.Ok && assertion.SqlState is { Length: 5 } state && observed.Error?.StartsWith(state + ":") == true
                ? new(id, true, label) : Fail("Kontrollér, at reglen afviser den angivne værdi med den forventede databasefejl.");
        if (!observed.Ok)
            return Fail(observed.Error ?? "PostgreSQL kunne ikke køre forespørgslen.");
        if (assertion.Expected is null)
            return Fail("Kontrollen mangler et forventet resultat.");
        var difference = CompareResult(observed, assertion);
        return difference is null ? new(id, true, label) : Fail(difference);
    }

    private static string? CompareResult(ExecuteResult actual, ExerciseAssertion assertion)
    {
        var expected = assertion.Expected!;
        if (actual.Truncated)
            return "Resultatet har for mange rækker. Kontrollér filteret og eventuelle JOINs.";
        if (actual.Rows.Count != expected.Count)
            return $"Forventede {expected.Count} rækker og fik {actual.Rows.Count}. Kontrollér filteret og eventuelle dubletter.";
        if (assertion.Columns is { } columns && !columns.SequenceEqual(actual.Columns))
            return $"Kontrollér kolonnerne og deres alias. Forventede {string.Join(", ", columns)}.";
        if (expected.Count > 0 && actual.Columns.Length != expected[0].Count)
            return $"Forventede {expected[0].Count} kolonner og fik {actual.Columns.Length}.";

        bool RowMatches(object?[] row, List<object?> reference) =>
            row.Length == reference.Count && row.Zip(reference).All(pair => EqualValue(pair.First, pair.Second));

        if (assertion.Ordered)
        {
            for (var i = 0; i < expected.Count; i++)
                if (!RowMatches(actual.Rows[i], expected[i]))
                    return $"Række {i + 1} afviger. Kontrollér værdierne og den ønskede sortering.";
        }
        else
        {
            // Consume each match once so duplicate rows retain their multiplicity.
            var remaining = actual.Rows.ToList();
            foreach (var reference in expected)
            {
                var index = remaining.FindIndex(row => RowMatches(row, reference));
                if (index < 0) return "Rækkerne indeholder andre værdier eller et andet antal dubletter.";
                remaining.RemoveAt(index);
            }
        }
        return null;
    }

    private static bool EqualValue(object? actual, object? expected)
    {
        if (expected is not JsonElement json) return Equals(actual, expected);
        return json.ValueKind switch
        {
            JsonValueKind.Null => actual is null,
            JsonValueKind.True or JsonValueKind.False => actual is bool value && value == json.GetBoolean(),
            JsonValueKind.Number => actual is not (null or string or bool) && json.TryGetDecimal(out var n)
                && decimal.TryParse(Convert.ToString(actual, CultureInfo.InvariantCulture), NumberStyles.Float,
                    CultureInfo.InvariantCulture, out var observed) && n == observed,
            JsonValueKind.String => string.Equals(Convert.ToString(actual, CultureInfo.InvariantCulture),
                json.GetString(), StringComparison.Ordinal) && actual is not null,
            _ => false
        };
    }
}
