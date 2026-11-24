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
    -- Beskriv prisgrænsen med et CASE-udtryk.
---

# Opgave D — CASE og UNION

Hvilket prisniveau skal en vare til præcis 40 få? Beslut dig, før du vælger sammenligningsoperatoren.

## Del 1

Vis `name`, `price` og en kolonne `niveau` for alle produkter:
- `'premium'` hvis `price >= 40`
- ellers `'standard'`

Sorter på `name`.

## Del 2

Vis en kolonne `navn` med **alle produktnavne** samt kundenavnet **`'Testkunde'`** (brug `UNION`). Sorter på `navn`.

Prøv efter tjekket at erstatte Testkunde med Espresso. Forudsig forskellen mellem `UNION` og `UNION ALL`, og afprøv begge i editoren.
