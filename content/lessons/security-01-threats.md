---
title: 1. GameHub under angreb — tænk som en forsvarer
slug: security-01-threats
module: security
order: 1
kind: theory
objectives:
  - Beskrive trusler mod fortrolighed, integritet og tilgængelighed
  - Bruge parametre til værdier og allowlist til SQL-identifikatorer
  - Begrunde mindst mulige rettigheder
---

# GameHub under angreb — tænk som en forsvarer

![Raymond undersøger GameHubs sikkerhed](/raymond/course/security.webp)

**Mission · Målpind 23, med støtte til 14 · 25 minutter.** GameHub åbner sin turnering om en time. På skærmen skal der stå gamernavne og sejre. I databasen ligger også e-mailadresser. Raymond spørger: »Hvis én søgefunktion fejler, hvor meget kan en fremmed så få adgang til?«

## Tre ting vi beskytter

| Egenskab | GameHubs regel | Et brud |
|---|---|---|
| Fortrolighed | Kun de rette personer ser e-mailadresser | Leaderboardet lækker kontaktoplysninger |
| Integritet | Ingen kan give sig selv 999 sejre | Et manipuleret input ændrer stillingen |
| Tilgængelighed | Tilmeldinger virker under finalen | En dyr forespørgsel blokerer databasen |

Tegn datarejsen: browser → API → database → backup. Skriv ved hver pil, hvem der kan påvirke data. API'et validerer både identitet og adgang; en skjult knap i browseren er ikke adgangskontrol.

## Input er data, også når det ligner SQL

```csharp
// Værdien sendes separat fra SQL-teksten.
await using var cmd = new NpgsqlCommand(
    "SELECT display_name FROM players WHERE display_name = @name", conn);
cmd.Parameters.AddWithValue("name", input);
await using var reader = await cmd.ExecuteReaderAsync();
```

Inputtet `Nova' OR '1'='1` skal søge efter netop det gamernavn. Det må ikke ændre forespørgslens betydning. Strengkonkatenering og interpoleret rå SQL med brugerinput bryder denne adskillelse. At fjerne apostroffer ødelægger legitime navne og er ikke løsningen. EF Core LINQ og korrekt parametriserede rå SQL-API'er kan hjælpe; ORM gør usikkert sammensat SQL sikkert lige så lidt som en sikkerhedssele reparerer en defekt bil.

## Kolonnenavne kan ikke være værdiparametre

`ORDER BY @column` vælger ikke en dynamisk kolonne. Vælg SQL-identifikatorer fra en fast liste, og parameterisér stadig værdierne:

```csharp
var orderBy = sort switch
{
    "name" => "display_name",
    "wins" => "wins",
    _ => throw new ArgumentException("Ukendt sortering")
};
var sql = $"SELECT display_name, wins FROM players ORDER BY {orderBy}";
```

Her indsættes kun vores egne to faste SQL-fragmenter. Retning som ASC/DESC kræver også en allowlist.

## Begræns konsekvensen

App-rollen skal kunne præcis det nødvendige. Migrationer og oprettelse af roller udføres af en separat administrator. Et offentligt leaderboard kan læse et view med to ufølsomme kolonner; det behøver hverken e-mail, DELETE eller superuser. Et view hjælper kun, hvis adgang til de underliggende data også er begrænset. Husk adgang til schemaet og eventuelle sekvenser ved legitim skrivning.

## Makkerduel: find den farligste antagelse

1. »Vi bruger EF Core, så alle vores rå SQL-strenge er sikre.«
2. »Databasen er i Docker, så den behøver ikke adgangskontrol.«
3. »Knappen er skjult for elever, så endpointet kan ikke misbruges.«

Vælg én påstand. Vis, hvor angrebet kan komme ind, og foreslå en kontrol, der kan afprøves. Gå videre til [Leaderboard uden datalæk](/learn/security-ex-01).

Kilder: [OWASP: SQL injection](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), [OWASP: databasesikkerhed](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html).
