---
title: 1. Kan din database bestå finalen?
slug: testing-01-plan
module: testing
order: 1
kind: theory
objectives:
  - Udlede en testplan fra databasens regler
  - Skelne positive, negative og grænsetests
  - Dokumentere forventet resultat og faktisk evidens
---

# Kan din database bestå finalen?

![Raymond undersøger testresultater](/raymond/course/testing.webp)

**Mission · Målpind 24 · 25 minutter.** GameHubs finalebilletter er klar. En køber bestiller nul billetter; en anden indsender den samme billetkode to gange. »Den virker på min maskine« er ikke et svar, der hjælper dørvagten.

## En regel er starten på en test

| Regel | Positiv test | Negativ test | Grænse |
|---|---|---|---|
| Antal billetter er 1–4 | Køb 2 | Køb 0 eller 5 | Prøv 1 og 4 |
| Billetkoden er unik | Ny kode | Samme kode igen | Samme tegn med anden casing: hvad er kravet? |
| Køberen skal findes | Kendt player-id | Ukendt id | Slettet køber |
| Gamernavn er påkrævet | `Nova` | NULL | Tom tekst: er det også forbudt? |

`NOT NULL` forbyder ikke `''`. `CHECK (quantity BETWEEN 1 AND 4)` forbyder ikke i sig selv NULL, fordi CHECK accepterer ukendt resultat; derfor er NOT NULL en separat beslutning. Tests finder netop den slags huller.

## Giv hver test et beviskrav

En nyttig testbeskrivelse indeholder **starttilstand, handling, forventning og oprydning**. Eksempel: »Med én billet med koden FINAL-1: indsæt en ny med samme kode; forvent PostgreSQL-fejl 23505; databasen skal stadig have én billet.«

For negative tests er det ikke nok, at »noget fejler«. Tjek den relevante SQLSTATE: 23502 = NOT NULL, 23503 = FK, 23505 = UNIQUE, 23514 = CHECK. En skrivefejl i tabellens navn ville også give fejl, men beviser ikke reglen.

## Test først det, der kan koste nogen noget

Start med kerneflowet. Når det virker, læg tests på de regler, der beskytter penge, pladser, adgang og historik. Brug et lille deterministisk datasæt og giv testene genkendelige navne. I behøver ikke teste PostgreSQLs egen addition; I skal teste jeres model og appens brug af den.

## Prøv selv

1. Skriv fire testcases til GameHub inden I kigger i [Billetter uden smuthuller](/learn/testing-ex-01).
2. Forudsig udfaldet ved NULL, 0, 1, 4 og 5.
3. Byt testplan med en makker: kan vedkommende udføre testen uden at gætte?

Gem planen som en del af afleveringen. Grønne opgavechecks viser kun de kontroller, platformen udfører; jeres forklaring og øvrige testcases skal stadig vurderes.

Kilder: [PostgreSQL: constraints](https://www.postgresql.org/docs/16/ddl-constraints.html), [Microsoft: test mod rigtig database](https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy).
