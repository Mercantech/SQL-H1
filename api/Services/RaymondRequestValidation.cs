using SqlH1.Api.Models;

namespace SqlH1.Api.Services;

public static class RaymondRequestValidation
{
    public static string? Validate(RaymondChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message)) return "Skriv et spørgsmål til Raymond.";
        if (request.Message.Length > 4000) return "Spørgsmålet må højst være 4.000 tegn.";
        if (request.ContentSlug?.Length > 200 || request.Path?.Length > 400) return "Sidekonteksten er for lang.";
        if (request.CurrentSql?.Length > 12000) return "Den medsendte SQL må højst være 12.000 tegn.";
        if (request.LastError?.Length > 3000 || request.ResultSummary?.Length > 1200) return "Resultatet eller fejlbeskeden er for lang.";
        if (request.History is null || request.History.Count > 12) return "Samtalen må højst medtage 12 tidligere beskeder.";
        foreach (var message in request.History)
        {
            if (message is null || message.Role is not ("user" or "assistant") || string.IsNullOrWhiteSpace(message.Text))
                return "Samtalen indeholder en ugyldig besked.";
            if (message.Text.Length > 6000) return "En tidligere besked er for lang. Start eventuelt en ny samtale.";
        }
        if (request.CheckMessages?.Count > 8 || request.CheckMessages?.Any(message => message is null || message.Length > 600) == true)
            return "Tilbagemeldingen fra opgaven er for lang.";
        return null;
    }
}
