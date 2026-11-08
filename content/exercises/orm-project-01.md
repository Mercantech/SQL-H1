---
title: "Projekt — byg GameHubs holdturneringer med EF Core"
slug: orm-project-01
module: orm
order: 10
kind: project
objectives:
  - Forklare ORM og implementere en udvidet domain-model
  - Lade EF Core generere databaseskema og forespørgsler
  - Dokumentere en migration som bevarer eksisterende data
---

# Byg GameHubs holdturneringer med EF Core

![Raymond arbejder med objektmodeller](/raymond/course/orm.webp)

**Mission:** Raymond har lovet en præmiepulje og holdtilmeldinger til fredagens turnering. Du er udvikleren, der skal få løftet fra en C#-klasse til en rigtig database.

**Tid:** 2–3 lektioner. Arbejd alene eller i par, men begge skal kunne forklare koden. **Målpinde:** #18 og #19.

Hent [GameHub-laboratoriet](/downloads/orm-lab.zip), og følg README. Arbejdet foregår i dit lokale C#-/Docker-projekt. SQL-H1-editoren bygger eller afprøver ikke denne opgave.

## Niveau 1 — få motoren til at starte

1. Tegn de eksisterende entiteter og forklar mappingen til PK, FK og det unikke indeks.
2. Generér `InitialGameHub`, læs migrations-SQL, og anvend migrationen.
3. Kør C#-demoen to gange. Den skal fortsat vise 3 turneringer og 3 tilmeldinger.
4. Gem LINQ-rapporten og dens genererede SQL. Forklar filter, sortering og optælling.

## Niveau 2 — lever din egen model

1. Tilføj `PrizePool` til `Tournament` som `numeric(10,2)` og en CHECK mod negative værdier. Brug 0 til gamle rækker.
2. Generér og gennemgå en ny migration. Anvend den, og bevis, at de gamle rækker er bevaret.
3. Tilføj din egen `Team`-entitet med primærnøgle og påkrævet navn. En `Registration` skal valgfrit kunne pege på ét team gennem en FK.
4. Generér endnu en migration. Opret mindst to teams og forbind nogle tilmeldinger med dem fra **C#**.
5. Skriv en LINQ-rapport med teamnavn og deltagerantal. Medtag et team uden tilmeldinger, så du kan kontrollere nul-tilfældet.

**Forudsig:** Hvad bør databasen gøre, hvis du indsætter samme spillertag to gange i samme turnering? Afprøv det i labben og gem fejlen. Afprøv også en negativ præmiepulje. Forklar, hvorfor en fejl fra en constraint kan være tegn på, at databasen virker som ønsket.

## Niveau 3 — Raymonds ekstra bestilling

Tilføj en rapport med ledige pladser pr. turnering uden at indlæse alle tilmeldinger som objekter. Vis SQL'en, og argumentér for de kolonner, du faktisk henter. Bonusdelen er valgfri; de to første niveauer udgør kerneopgaven.

## Aflever det, der kan efterprøves

Aflever projektets kildekode og migrationer uden `.env`, `bin` eller `obj`, et E/R-diagram samt `beviser.md` med:

- Dine model- og mappingbeslutninger og en kort ORM-forklaring.
- Migrations-SQL og antal oprindelige rækker før/efter ændringen.
- LINQ, genereret SQL og faktiske resultater fra teamrapporten.
- Dublet- og negativ-prøve med forventet og faktisk udfald.
- Kommandoer, som en anden elev kan gentage fra en frisk lab.

## Sådan vurderes løsningen

| Du viser | Klar til gennemgang når |
|---|---|
| ORM-forståelse #18 | Du kan pege på forskellen mellem model, provider, SQL og database |
| Domain-model #19 | Dine egne entiteter og relationer findes både i C# og PostgreSQL |
| Skemaudvikling #19 | Migrationerne er gennemgået og bevarer de oprindelige data |
| Genererede forespørgsler #19 | Rapporten køres fra C#, og du kan forklare den genererede SQL |

Underviseren gennemgår din løsning. En markering af “klar til gennemgang” er din egen status og erstatter ikke en faglig vurdering.
