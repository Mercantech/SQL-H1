---
title: Opgave — Tilføj CHECK og UNIQUE
slug: constraints-ex-01
module: constraints
order: 10
kind: exercise
objectives:
  - ALTER TABLE ADD CONSTRAINT
  - CHECK og UNIQUE
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/constraints-ex-01/checks.json
  starterSql: |
    -- Angiv tabellen, kolonnen og den regel, der skal gælde.
---

# Opgave — Tilføj CHECK og UNIQUE

Forudsig, hvilke af priserne 0, −0.01 og 0.01 den nye regel skal acceptere. Vælg også en eksisterende e-mail til at undersøge unikhed.

## Krav

1. Tilføj constraint **`products_price_positive`**: `CHECK (price > 0)` på `products`.

2. Tilføj constraint **`customers_email_unique`**: `UNIQUE (email)` på `customers`.

Tip: Hvis du kører scriptet flere gange, brug `DROP CONSTRAINT IF EXISTS …` først — eller nulstil databasen.

Efter **Tjek svar** skal du kunne forklare, hvorfor 0.01 accepteres, og hvorfor en gentaget e-mail og prisen 0 afvises af hver sin regel. Genbesøg om en uge [databasetest](/learn/testing-01-plan), og skriv de tre tilfælde som forventning og observation.
