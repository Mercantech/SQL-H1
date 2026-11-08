---
title: 1. Vælg GameHubs motor — med en begrundelse
slug: database-choice-01-architecture
module: database-choice
order: 1
kind: theory
objectives:
  - Skelne databasevalg fra valg af adgangslag
  - Sammenholde relationel database og dokumentdatabase med konkrete krav
  - Beskrive fordele og omkostninger ved ORM og rå SQL
---

# Vælg GameHubs motor — med en begrundelse

![Raymond sammenligner databasevalg](/raymond/course/choice.webp)

**Mission · 25 minutter · Målpind #22**

GameHub skal vise spillerprofiler, reservere turneringspladser og levere et dashboard. Kunden spørger: »Skal vi bruge SQL, EF Core eller MongoDB?«

Raymond tager en tusch frem. Spørgsmålet indeholder **to valg på forskellige niveauer**.

## Først databasemodel, derefter adgangslag

```text
C# → EF Core / Dapper / Npgsql → PostgreSQL
C# → MongoDB-driver           → MongoDB
```

**ORM er et adgangslag**, ikke en selvstændig databasetype. EF Core kan generere SQL til PostgreSQL; Dapper mapper data, mens du skriver SQL. Du kan også bruge både ORM og håndskrevet SQL i samme applikation.

| Valg | Kan være velegnet når | Du skal undersøge |
|---|---|---|
| Relationelt skema | Relationer, integritetsregler og rapporter er centrale | JOINs, indekser, transaktioner og modelændringer |
| Dokumentmodel | Små sammenhængende dokumenter følger læsemønstret | Vækst, kopierede data, validering og tværgående relationer |
| EF Core over SQL | Modeller, migrationer og almindelig CRUD fylder meget | Genereret SQL, tracking, antal kald og projektion |
| Dapper/rå SQL over SQL | Teamet har brug for præcis kontrol over forespørgsler | Manuel mapping/design, vedligehold og parametre |

Raymond skriver kravene ved siden af produktnavnene. Der findes ingen regel om, at dokumentdatabaser altid er hurtigere, eller at ORM altid er langsomt. Datamodel, forespørgsler, indeks, netværk, datamængde og belastning bestemmer resultatet, så hvert valg skal undersøges i sin sammenhæng.

> [!RAYMOND:thinking] To beslutninger på tavlen
>
> Tegn **databasevalget** og **adgangslaget** som to separate beslutninger. Hvis GameHub skifter fra Dapper til EF Core over samme PostgreSQL-database, hvilke data og regler kan blive stående? Hvad skal undersøges igen i C#-koden?

## Tre ønsker fra kunden

1. **Profilkort:** Vis én spillers indstillinger og fem favoritspil.
2. **Tilmelding:** Den sidste turneringsplads må ikke sælges to gange.
3. **Dashboard:** Tæl aktive deltagere pr. spil og uge.

Raymond følger én brugerhandling ad gangen. Et indlejret profilkort kan passe godt til dokumenter; den sidste plads kræver et gennemtænkt konsistensflow i begge databasefamilier. Relationelle rapporter kan passe godt til SQL. Et hybridvalg kan være fornuftigt, men så skal Raymond også overvåge, sikre og tage backup af to databasesystemer.

## ORM-fælden: 1 + N kald

Henter din kode først 100 turneringer og derefter deltagere med ét kald pr. turnering, har du lavet op til 101 databasekald. Det kaldes **N+1**. Det kan opstå med ORM, men lignende loops kan også skrives med rå SQL.

En projektion med `Select` kan hente de nødvendige felter i få forespørgsler. `AsNoTracking` kan reducere tracking-arbejde ved læsning, men erstatter ikke et godt querydesign. Undersøg EF Cores SQL med `ToQueryString()` og antal faktiske kald i logging.

## Pitch på 60 sekunder

Vælg løsning til ét af de tre kundeønsker. Brug sætningen:

> Vi vælger ___ fordi adgangsmønstret er ___. Den største omkostning er ___. Vi vil måle ___, før vi kalder det hurtigt nok.

En brugbar beslutning beskriver både, hvad løsningen gør let, og hvilket arbejde teamet selv overtager.

> [!RAYMOND:skeptical] Forsvar dit valg med en ulempe
>
> Vælg løsning til ét kundeønske. Giv din makker **det stærkeste modargument** til dit valg og en konkret test, der kunne få dig til at vælge om. Begrundelsen skal handle om adgangsmønster, konsistens eller drift og kunne forstås uden et produktlogo.

Kilder: [EF Core: effektiv forespørgsel](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying) og [MongoDB-datamodellering](https://www.mongodb.com/docs/manual/data-modeling/).
