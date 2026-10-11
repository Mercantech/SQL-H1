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
    ALTER TABLE products
      ADD CONSTRAINT products_price_positive CHECK (price > 0);
---

# Opgave — Tilføj CHECK og UNIQUE

## Krav

1. Tilføj constraint **`products_price_positive`**: `CHECK (price > 0)` på `products`.

2. Tilføj constraint **`customers_email_unique`**: `UNIQUE (email)` på `customers`.

Tip: Hvis du kører scriptet flere gange, brug `DROP CONSTRAINT IF EXISTS …` først — eller nulstil databasen.
