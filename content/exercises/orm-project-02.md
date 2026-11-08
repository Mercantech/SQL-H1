---
title: "Projekt — overtag Raymonds gamle database"
slug: orm-project-02
module: orm
order: 11
kind: project
objectives:
  - Lade EF Core generere en domain-model fra en eksisterende database
  - Opdatere genererede modeller efter en schemaændring
  - Bevare egne partial-klasser og dokumentere database-first-arbejdsgangen
---

# Overtag Raymonds gamle database

![Raymond arbejder med objektmodeller](/raymond/course/orm.webp)

**Mission:** Den gamle GameHub-server har tabeller og data, men ingen vedligeholdt C#-kode. Du skal genopbygge dataadgangen og bevise, at næste databaseændring heller ikke ødelægger dine egne tilføjelser.

**Tid:** 1–2 lektioner. **Målpind:** #20. Brug database-first-delen i [GameHub-laboratoriet](/downloads/orm-lab.zip).

## Før du genererer

1. Læs SQL-skemaet i `database/init.sql` og tegn de to legacy-tabeller med nøgler og kardinalitet.
2. Skriv hvilke C#-egenskaber du forventer at få, og hvilke der må være `null`.
3. Forklar, hvorfor `gamehub_legacy` er adskilt fra code-first-databasen.

## Få den gamle server til at tale C#

1. Start labben efter README, og kør `docker compose run --rm workshop sh tools/scaffold.sh`.
2. Find de genererede entiteter og `LegacyContext`. Sammenlign PK, FK, typer og navigationer med databasen.
3. Kør `LegacyDemo`. Forvent to turneringer og tre registreringer på en frisk lab.
4. Skriv en ekstra C#-forespørgsel mod de **genererede** typer, som viser hver turnering og antallet af tilmeldinger. Kontrollér resultatet med SQL.

## Bevis, at du kan overleve en opdatering

1. Tilpas teksten i `DatabaseFirst/Extensions/Tournament.Display.cs`, så du tydeligt kan genkende din egen ændring.
2. Tilføj `platform varchar(30) NOT NULL DEFAULT 'PC'` i **databasen** ved at følge README'ens SQL-trin.
3. Scaffold igen. Gennemse den genererede diff og brug den nye `Platform`-egenskab i C#-demoen.
4. Bevis, at din egen visningstekst og alle oprindelige rækker stadig findes.
5. Kontrollér, at der ikke står adgangskoder eller en hardcodet connection string i de genererede filer.

**Raymonds stopspørgsmål:** Din makker vil rette `Title` direkte i en genereret fil og trykke “scaffold” igen i morgen. Hvad risikerer I? Vis den konkrete mappe, hvor egen kode i stedet skal ligge.

## Aflevering og vurdering

Aflever koden uden `.env`, dit E/R-diagram og `beviser.md` med:

| Bevis | Det skal kunne ses |
|---|---|
| Første generation | Den anvendte scaffold-kommando og modelklasser, som passer til den eksisterende database |
| Forespørgsel fra C# | LINQ, genereret SQL og resultat sammenholdt med din kontrol-SQL |
| Anden generation | `Platform` findes efter databaseændringen; din egen partial-klasse er bevaret |
| Arbejdsgang | En kort sammenligning med code-first og en forklaring af skemaejerskabet |

**Færdig til gennemgang:** En anden elev kan følge dine kommandoer og få en model fra databasen. Du kan forklare, hvad EF genererer, og hvad du selv skal vedligeholde. Underviseren vurderer løsningen; SQL-H1 udfører ikke C#-projektet for dig.
