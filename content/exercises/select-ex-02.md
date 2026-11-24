---
title: Opgave B — Sortering og filtre
slug: select-ex-02
module: select
order: 11
kind: exercise
objectives:
  - ORDER BY og LIMIT
  - IN, BETWEEN og LIKE
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-ex-02/checks.json
  starterSql: |
    -- Byg listen over drikke med pris og den ønskede sortering.
---

# Opgave B — Sortering og filtre

Skriv først de to sorteringsretninger, du har brug for til henholdsvis caféens dyreste og billigste varer.

## Del 1

Vis `name` og `price` for alle **Drikke**, sorteret med **dyreste først**.

## Del 2

Vis de **3 billigste** produkter (`name`, `price`) — uanset kategori.

## Del 3

Vis kunder hvis navn ender på **sen** (`name`, `city`), sorteret på `name`.

Se på den første og sidste række, når du har sorteret drikkevarerne. Byt retning og forudsig den nye første række, før du kører igen.
