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
    -- Skriv din egen katalogforespørgsel til første del.
---

# Opgave — Katalogforespørgsler

## Del 1

List alle **basistabeller** i `public` (`table_type = 'BASE TABLE'`). Returnér `table_name` sorteret alfabetisk.

## Del 2

Tæl antal indeks i `public` via `pg_indexes` (kolonne `antal`).

Skriv begge svar i hvert sit svarfelt. Sammenhold de fundne navne med dit E/R-diagram. Genbrug skelnen mellem tabeller og indeks, når du i [restore-øvelsen](/learn/testing-project-01) skal forklare, hvad der er gendannet.
