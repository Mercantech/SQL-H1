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

**Mission · Målpind 24 · 25 minutter.** Raymond tester GameHubs finalebilletter, før dørene åbner. Først køber han to billetter. Så prøver han nul, og til sidst genbruger han den samme billetkode. Det gode første køb viser kun én vej gennem systemet; nu undersøger han, om databasen også holder reglerne, når inputtet ligger lige uden for det tilladte.

> [!RAYMOND:testing] Skriv forventningen før forsøget
>
> Der må købes **1–4 billetter**. Hvad skal ske ved `0`, `1`, `4`, `5` og `NULL`? Skriv både svaret til køberen og den forventede tilstand i databasen, før I prøver.

## En regel er starten på en test

| Regel | Positiv test | Negativ test | Grænse |
|---|---|---|---|
| Antal billetter er 1–4 | Køb 2 | Køb 0 eller 5 | Prøv 1 og 4 |
| Billetkoden er unik | Ny kode | Samme kode igen | Samme tegn med anden casing: hvad er kravet? |
| Køberen skal findes | Kendt player-id | Ukendt id | Slettet køber |
| Gamernavn er påkrævet | `Nova` | NULL | Tom tekst: er det også forbudt? |

Raymond læser hver regel som en påstand, der skal kunne modbevises. `NOT NULL` forbyder ikke `''`. `CHECK (quantity BETWEEN 1 AND 4)` afviser FALSE, men accepterer ukendt resultat; derfor kræver et forbud mod NULL også `NOT NULL`. Tests finder netop den slags huller mellem den skrevne regel og den faktiske model.

Vær også præcis om relationen: En fremmednøgle afviser et ukendt player-id, men en nullable FK-kolonne kan stadig være NULL. Kræver hver billet en køber, skal både en eksisterende reference og en udfyldt reference håndhæves.

## Giv hver test et beviskrav

En nyttig testbeskrivelse indeholder **starttilstand, handling, forventning og oprydning**. Eksempel: »Med én billet med koden FINAL-1: indsæt en ny med samme kode; forvent PostgreSQL-fejl 23505; databasen skal stadig have én billet.«

For negative tests er det ikke nok, at »noget fejler«. Tjek den relevante SQLSTATE: 23502 = NOT NULL, 23503 = FK, 23505 = UNIQUE, 23514 = CHECK. En skrivefejl i tabellens navn ville også give fejl, men beviser ikke reglen.

> [!RAYMOND:debugging] Var det den rigtige fejl?
>
> Dublettesten fejler, fordi testens køber-id ikke findes. Har I nu bevist, at billetkoden er unik? Gør **alle andre felter gyldige**, og kontrollér, at forsøget rammer `23505` fra den tilsigtede regel.

## Test først det, der kan koste nogen noget

Raymond prioriterer først, at en normal tilmelding kan gennemføres. Når kerneflowet virker, lægger han tests på de regler, der beskytter penge, pladser, adgang og historik. Brug et lille deterministisk datasæt og giv testene genkendelige navne. I behøver ikke teste PostgreSQLs egen addition; I skal teste jeres model og appens brug af den.

Par hver afvisning med en gyldig naboværdi: Hvis nul afvises, skal én stadig accepteres. Ellers kan en fejl, der afviser alle køb, se ud som en vellykket negativ test. Skriv desuden, hvilke data testen efterlader, så en tidligere kørsel ikke ændrer næste tests starttilstand.

## Prøv selv

1. Skriv fire testcases til GameHub inden I kigger i [Billetter uden smuthuller](/learn/testing-ex-01).
2. Forudsig udfaldet ved NULL, 0, 1, 4 og 5.
3. Byt testplan med en makker: kan vedkommende udføre testen uden at gætte?

Gem planen som en del af afleveringen. Grønne opgavechecks viser kun de kontroller, platformen udfører; jeres forklaring og øvrige testcases skal stadig vurderes.

> [!RAYMOND:idea-notes] Kan makkeren gentage beviset?
>
> Vælg testen af den sidste gyldige værdi, `4`. Lad makkeren starte fra jeres beskrevne data og køre den uden hjælp. Hvis resultatet afviger, så undersøg **starttilstand, handling og forventning** én ad gangen.

Kilder: [PostgreSQL: constraints](https://www.postgresql.org/docs/16/ddl-constraints.html), [Microsoft: test mod rigtig database](https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy).
