---
title: Opgave D — CASE og UNION
slug: select-ex-04
module: select
order: 13
kind: exercise
objectives:
  - CASE-udtryk
  - UNION
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-ex-04/checks.json
  starterSql: |
    SELECT name, price,
      CASE
        WHEN price >= 40 THEN 'premium'
        ELSE 'standard'
      END AS niveau
    FROM products
    ORDER BY name;
---

# Opgave D — CASE og UNION

## Del 1

Vis `name`, `price` og en kolonne `niveau` for alle produkter:
- `'premium'` hvis `price >= 40`
- ellers `'standard'`

Sorter på `name`.

## Del 2

Vis en kolonne `navn` med **alle produktnavne** samt kundenavnet **`'Testkunde'`** (brug `UNION`). Sorter på `navn`.
