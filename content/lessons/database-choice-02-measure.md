---
title: 2. Hurtigt nok til hvad? Mål før du vælger
slug: database-choice-02-measure
module: database-choice
order: 2
kind: theory
objectives:
  - Omsætte et performancebehov til en reproducerbar undersøgelse
  - Skelne serverplan fra svartid i en hel applikation
  - Fortolke målinger med datamængde, indeks og begrænsninger
---

# Hurtigt nok til hvad? Mål før du vælger

**Mission · 30 minutter · Målpind #22**

»Det føles hurtigere« er starten på en hypotese. Det er ikke slutningen på en undersøgelse.

## Aftal banen før løbet

GameHub har et **øvelseskrav**: et EU-toplistekald skal kunne levere de samme 20 profiler på under 100 ms i den aftalte lokale test. Tallet er et projektkrav, ikke en garanti for dit udstyr.

Aftal før testen:

- Samme 10.000 logiske spillerprofiler, filter, rækkefølge og 20 resultatposter.
- Samme krævede felter og samme korrekthedscheck.
- Dokumenteret databaseversion, maskine, indeks og datamængde.
- Én opvarmning og mindst syv gentagelser. Gem alle tal; brug median, og forklar spredning.
- Om du måler kun serverens arbejde eller hele klientkaldet inklusive netværk og mapping.

Når du vil måle noget andet, så giv forsøget et nyt navn. En forespørgsel, der kun tæller, konkurrerer ikke fair mod en, der returnerer hele profiler.

## Tre representationer, ét spørgsmål

[Dokumentlabben](/learn/database-choice-project-01) indeholder samme deterministiske benchmarkdata i normaliseret PostgreSQL, JSONB i PostgreSQL og MongoDB. Brug dem til at undersøge planer og indeks inden for hver løsning.

| Værktøj | Viser blandt andet | Viser ikke alene |
|---|---|---|
| PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` | Faktiske rækker, serverens køretid og bufferarbejde | C#-mapping, netværk eller hele HTTP-kaldet |
| MongoDB `explain("executionStats")` | Plan, undersøgte dokumenter/nøgler og returnerede dokumenter | Et fuldt applikationsbenchmark |
| Stopwatch omkring et C#-kald | Klientens målte tid for det omsluttede arbejde | Hvorfor planen var dyr |

Servernes explain-tider har forskellige målemetoder og opløsning. Brug ikke en enkelt `0 ms` fra MongoDB til at konkludere, at den slår PostgreSQL. Gem planerne som forklaringer, og brug ens klientmålinger, hvis du vil lave en direkte hastighedsrangering.

## Gør én ændring ad gangen

1. Kør en korrekt forespørgsel uden det foreslåede indeks.
2. Gem resultat og plan.
3. Tilføj ét relevant indeks og opdatér statistik efter behov.
4. Gentag samme forespørgsel og kontrollér, at resultatet er uændret.
5. Forklar ændringen i arbejde og tid. Indeks kan også koste ved skrivning.

Lav derefter et **separat** ORM-forsøg i ORM-labben: sammenlign en fuld entitet med en projektion af kun nødvendige felter; log SQL og antal kald. Bland ikke det resultat sammen med en anden databases serverplan.

## Når målingen ikke afgør valget

Hvis alle løsninger opfylder svartidskravet, kan integritet, teamets erfaring, ændringer i data og drift være vigtigere. Hvis én måling er usikker, skriv det. En god beslutning kan sagtens være: »Vi vælger PostgreSQL nu og gentester ved 1 million profiler.«

**Dit checkpoint:** Du kan beskrive ét forsøg, der ville være fair, og ét, der ville give en misvisende konklusion.

Kilder: [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/16/using-explain.html), [MongoDB explain-resultater](https://www.mongodb.com/docs/manual/reference/explain-results/) og [EF Core performanceundersøgelser](https://learn.microsoft.com/en-us/ef/core/performance/performance-diagnosis).
