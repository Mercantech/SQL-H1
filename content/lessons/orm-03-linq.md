---
title: "3. LINQ — kig under motorhjelmen"
slug: orm-03-linq
module: orm
order: 3
kind: theory
objectives:
  - Skrive LINQ som EF Core oversætter til SQL
  - Skelne en forespørgsels beskrivelse fra dens udførelse
  - Undersøge projektion, tracking og risikoen for unødvendige databasekald
---

# LINQ — kig under motorhjelmen

![Raymond arbejder med objektmodeller](/raymond/course/orm.webp)

Raymond siger: “Vis mig CS2-turneringerne og deres ledige pladser.” Du kan skrive SQL'en. Nu skal EF gøre det for dig, og du skal kunne kontrollere resultatet.

## En bestilling, ikke en liste endnu

```csharp
var game = "Counter-Strike 2";
var query = db.Tournaments
    .AsNoTracking()
    .Where(t => t.GameTitle == game)
    .OrderBy(t => t.StartsAtUtc)
    .Select(t => new
    {
        t.Title,
        SignedUp = t.Registrations.Count,
        SpotsLeft = t.MaxPlayers - t.Registrations.Count
    });
```

`query` beskriver arbejdet. EF's PostgreSQL-provider kan omsætte det til SQL. Kald som `ToListAsync`, `CountAsync` og `SingleAsync` udfører den relevante forespørgsel. En ny udførelse er et nyt databasekald; variablen er ikke en gemt kopi af et tidligere resultat.

```csharp
Console.WriteLine(query.ToQueryString());
var rows = await query.ToListAsync();
```

`ToQueryString()` er et redskab til at undersøge SQL'en; det henter ikke rækker. Kør selv labbens udgave:

```bash
docker compose run --rm workshop dotnet run --project CodeFirst -- sql
```

**Find tre spor:** Hvor ligger filteret? Hvordan tælles tilmeldingerne? Hvordan bliver `game` repræsenteret? SQL-formatet kan variere mellem provider-versioner; bedøm betydningen, ikke antallet af linjeskift.

## Fælden med den tidlige indkøbsvogn

Sammenlign:

```csharp
var a = await db.Tournaments
    .Where(t => t.GameTitle == game)
    .ToListAsync();

var all = await db.Tournaments.ToListAsync();
var b = all.Where(t => t.GameTitle == game).ToList();
```

Begge kan give de samme turneringer. Den første filtrerer på serveren. Den anden henter alle turneringer og filtrerer bagefter i programmet. Raymond vil derfor kontrollere **arbejdet bag svaret**, ikke kun de få rækker, der ender på skærmen.

> [!RAYMOND:skeptical] Samme rækker, samme arbejde?
>
> Forestil dig en million turneringer og kun ti med det valgte spil. Hvor mange rækker sendes omtrent over forbindelsen i de to udgaver? Peg på `ToListAsync`, hvor forespørgslen skifter fra **beskrivelse** til **udførelse**.

## Hent det, skærmen behøver

Raymonds skærm viser titel og deltagerantal. Rapporten vælger derfor bestemte felter med `Select`, en **projektion**, frem for automatisk at hente hele objektgrafen. Modellens mange egenskaber er ikke en bestilling på at sende dem alle til brugeren.

En almindelig læsning af entiteter kan spores af EF's change tracker. Når du ændrer en sporet entitet og kalder `SaveChangesAsync`, kan EF gemme ændringen. Til rene læsninger af entiteter er `AsNoTracking()` ofte relevant. Det gør ikke en dårlig forespørgsel god af sig selv.

**N+1** opstår, når én indledende forespørgsel efterfølges af et ekstra opslag for hver række. Lazy loading kan udløse det, men en løkke med manuelle opslag kan også. Labben har ikke slået lazy loading til. Navigationsegenskaber er derfor ikke i sig selv dokumentation for ekstra databasekald.

## To minutter som forespørgselsdetektiv

1. Tegn den SQL, du forventer fra rapporten, før du ser `ToQueryString()`.
2. Skift filteret til `Rocket League`. Hvilke rækker bør komme med?
3. Fjern `Select`, og sammenlign de kolonner, EF nu beder om.
4. Forklar, hvorfor et nul i deltagerantal skal blive til fuld kapacitet i `SpotsLeft`.
5. Skriv én fejl, som en kompilerende LINQ-forespørgsel stadig kan have.

Når du kan læse **både C# og SQL**, kan du kontrollere den dataadgang, ORM'en genererer. Raymond forventer en forklaring af filter, kolonner og databasekald, også når LINQ-koden kompilerer uden fejl.

> [!RAYMOND:thinking] Forklar ét databasekald
>
> Beskriv rapportens forventede **kolonner**, **filter** og **antal databasekald**, før du kører den. Henter `ToQueryString()` data? Hvad sker der, hvis samme `query` udføres med `ToListAsync` to gange?

**Målpinde:** #18 og #19. Læs [LINQ i EF Core](https://learn.microsoft.com/en-us/ef/core/querying/), [tracking](https://learn.microsoft.com/en-us/ef/core/querying/tracking) og [effektive forespørgsler](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying).
