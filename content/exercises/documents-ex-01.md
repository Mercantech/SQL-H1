---
title: Mission — Byg bro mellem SQL og dokumenter
slug: documents-ex-01
module: documents
order: 10
kind: exercise
objectives:
  - Udtrække og filtrere JSONB-felter med korrekte datatyper
  - Udfolde et array og aggregere dets indhold
  - Ændre ét indlejret felt uden at overskrive hele dokumentet
sandbox:
  seed: seeds/gamehub-documents.sql
  allowWrite: true
  checks: exercises/documents-ex-01/checks.json
  starterSql: |
    SELECT id, profile ->> 'handle' AS handle, profile
    FROM player_profiles
    ORDER BY id;
---

# Byg bro mellem SQL og dokumenter

**Mission · 35 minutter · Målpind #21 · SQL-opgave med automatisk kontrol**

Raymond vil have en invitationsliste og en spilstatistik. Du har fire profiler gemt som JSONB i PostgreSQL. Det er en bro til dokumentmodellen; den efterfølgende MongoDB-mission bruger en rigtig dokumentdatabase.

**Før du starter:** Tryk **Nulstil database** for at indlæse GameHub-profilerne. Det erstatter dine nuværende sandboxdata; gem SQL, du vil beholde. Startforespørgslen skal vise Nova, Pixel, Rune og Echo.

## 1. Invitationslisten

Opret viewet **`v_ranked_players`** med kolonnerne **`handle`** og **`rating`**. Det skal indeholde spillere fra `EU` med en numerisk rating på mindst `1200`. Rating skal returneres som et heltal.

Forventet indhold sorteret på handle: Nova 1450 og Pixel 1280.

## 2. Spilstatistikken

Opret viewet **`v_game_hours`** med kolonnerne **`game`** og **`hours`**. Udfold `profile.games` med `jsonb_array_elements`, og summér timerne pr. spil på tværs af alle profiler.

Forventet indhold: minecraft 18, rocket 36 og valorant 32. Echo har et tomt array og skal ikke skabe en falsk spilrække.

## 3. Tilgængelighed uden datatab

Opdatér kun Novas `settings.theme` til **`high-contrast`** med `jsonb_set`. Novas handle, rating og spil skal bevares. De andre profiler skal være uændrede.

## 4. Indeks med en forklaring

Opret GIN-indekset **`ix_player_profiles_profile`** på kolonnen `profile`. Forklar en makker, hvorfor indeholdelsesoperatoren `@>` kan bruge dette indeks, mens en numerisk rating-sammenligning ikke automatisk får gavn af det.

Tryk **Tjek svar**, når views, dataændring og indeks er på plads. Opgavekontrollen undersøger databasens tilstand; den mundtlige indeksforklaring vurderer I sammen med underviseren.

**Bonus:** Find alle profiler, der indeholder spillet rocket, med `@>`. Sammenlign planen før og efter indeks. Fire profiler er for lidt til en meningsfuld hastighedskonkurrence.
