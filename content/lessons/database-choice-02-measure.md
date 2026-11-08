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

Raymond får to demoer og hører: “Min løsning føles hurtigere.” Han beder først om at se, om de leverer det samme svar, og hvor stopuret starter og slutter. Fornemmelsen er en hypotese, som du nu skal gøre målbar.

## Aftal banen før løbet

GameHub har et **øvelseskrav**: et EU-toplistekald skal kunne levere de samme 20 profiler på under 100 ms i den aftalte lokale test. Tallet er et projektkrav, ikke en garanti for dit udstyr.

Aftal før testen:

- Samme 10.000 logiske spillerprofiler, filter, rækkefølge og 20 resultatposter.
- Samme krævede felter og samme korrekthedscheck.
- Dokumenteret databaseversion, maskine, indeks og datamængde.
- Én opvarmning og mindst syv gentagelser. Gem alle tal; brug median, og forklar spredning.
- Om du måler kun serverens arbejde eller hele klientkaldet inklusive netværk og mapping.

Raymond giver forsøget et navn og gemmer aftalen sammen med resultaterne. Ændrer du spørgsmålet, kræver det et nyt forsøg: en forespørgsel, der kun tæller, konkurrerer ikke fair mod en, der returnerer hele profiler.

## Tre representationer, ét spørgsmål

[Dokumentlabben](/learn/database-choice-project-01) indeholder samme deterministiske benchmarkdata i normaliseret PostgreSQL, JSONB i PostgreSQL og MongoDB. Brug dem til at undersøge planer og indeks inden for hver løsning.

| Værktøj | Viser blandt andet | Viser ikke alene |
|---|---|---|
| PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` | Faktiske rækker, serverens køretid og bufferarbejde | C#-mapping, netværk eller hele HTTP-kaldet |
| MongoDB `explain("executionStats")` | Plan, undersøgte dokumenter/nøgler og returnerede dokumenter | Et fuldt applikationsbenchmark |
| Stopwatch omkring et C#-kald | Klientens målte tid for det omsluttede arbejde | Hvorfor planen var dyr |

Servernes explain-tider har forskellige målemetoder og opløsning. Brug ikke en enkelt `0 ms` fra MongoDB til at konkludere, at den slår PostgreSQL. Gem planerne som forklaringer, og brug ens klientmålinger, hvis du vil lave en direkte hastighedsrangering.

## Gør én ændring ad gangen

> [!RAYMOND:skeptical] Er nul millisekunder en vinder?
>
> En explain-rapport viser `0 ms`, mens en anden viser en brøkdel af et millisekund. Er opløsning og målegrænse ens? Kontrollér **samme resultatfelter**, **samme rækker** og **samme målte arbejde**, før du bruger tallene til at rangere løsninger.

1. Kør en korrekt forespørgsel uden det foreslåede indeks.
2. Gem resultat og plan.
3. Tilføj ét relevant indeks og opdatér statistik efter behov.
4. Gentag samme forespørgsel og kontrollér, at resultatet er uændret.
5. Forklar ændringen i arbejde og tid. Indeks kan også koste ved skrivning.

Lav derefter et **separat** ORM-forsøg i ORM-labben: sammenlign en fuld entitet med en projektion af kun nødvendige felter; log SQL og antal kald. Bland ikke det resultat sammen med en anden databases serverplan.

## Når målingen ikke afgør valget

Hvis alle løsninger opfylder svartidskravet, spørger Raymond videre til integritet, teamets erfaring, ændringer i data og drift. Markér usikre målinger. En begrundet beslutning kan være: “Vi vælger PostgreSQL nu og gentester ved 1 million profiler,” når det beskrives, hvad der vil blive målt igen.

> [!RAYMOND:testing] Kan en makker gentage forsøget?
>
> Beskriv **ét fair forsøg** og **ét misvisende forsøg** med GameHub-data. Giv din makker versioner, data, indeks, forespørgsel og målegrænse. Forklar, hvorfor et nyt indeks både skal vurderes på læsegevinsten og på omkostningen ved skrivning.

Kilder: [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/16/using-explain.html), [MongoDB explain-resultater](https://www.mongodb.com/docs/manual/reference/explain-results/) og [EF Core performanceundersøgelser](https://learn.microsoft.com/en-us/ef/core/performance/performance-diagnosis).
