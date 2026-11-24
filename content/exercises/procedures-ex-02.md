---
title: Opgave B — Validerende funktion
slug: procedures-ex-02
module: procedures
order: 11
kind: exercise
objectives:
  - plpgsql med RAISE
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/procedures-ex-02/checks.json
  starterSql: |
    -- Skriv en funktion, som håndterer positive tal, nul, negative tal og NULL.
---

# Opgave B — Validerende funktion

## Krav

Opret funktionen **`require_positive(p_n INT)`**, der:

- returnerer `p_n`, hvis `p_n > 0`
- kaster fejl med `RAISE EXCEPTION`, hvis `p_n` er `NULL` eller `<= 0`

Kør `SELECT require_positive(1)` og prøv derefter `0`, `-1` og `NULL` hver for sig. Brug standardfejlkoden `P0001` fra `RAISE EXCEPTION` til de tre afvisninger. Skriv én sætning om, hvorfor sammenligningen med nul alene ikke håndterer NULL.
