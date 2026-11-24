---
title: Opgave F — NULL og COALESCE
slug: select-ex-06
module: select
order: 15
kind: exercise
objectives:
  - Filtrere på IS NULL
  - Bruge COALESCE i SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-ex-06/checks.json
  starterSql: |
    -- Vælg en læsbar tekst, når e-mailen mangler.
---

# Opgave F — NULL og COALESCE

Hvor mange gange optræder henholdsvis en manglende e-mail og en anonym ordre i resultaterne? Undersøg de to tabeller hver for sig.

## Del 1

Vis kunder i **Viborg** med kolonnerne `name` og `email_visning`, hvor `email_visning` er e-mailen — eller teksten **`(ingen e-mail)`** hvis `email` er `NULL`. Sorter på `name`.

## Del 2

Tæl hvor mange ordrer der er **walk-in** (`customer_id IS NULL`). Returnér én kolonne `antal`.

En anden dag kan du bruge filtre i [SQL-mysteriet](/murder). Start med én tabel, vælg to kolonner og forklar, hvad én resultatrække repræsenterer. Spillet har sit eget SQLite-datasæt.
