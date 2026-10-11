---
title: Opgave — Katalogforespørgsler
slug: drift-ex-01
module: drift
order: 10
kind: exercise
objectives:
  - Læse information_schema / pg_indexes
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/drift-ex-01/checks.json
  starterSql: |
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
---

# Opgave — Katalogforespørgsler

## Del 1

List alle **basistabeller** i `public` (`table_type = 'BASE TABLE'`). Returnér `table_name` sorteret alfabetisk.

## Del 2

Tæl antal indeks i `public` via `pg_indexes` (kolonne `antal`).
