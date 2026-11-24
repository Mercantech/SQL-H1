---
title: Opgave E — Vinduesfunktioner
slug: select-ex-05
module: select
order: 14
kind: exercise
objectives:
  - ROW_NUMBER pr. partition
  - DENSE_RANK ved en delt placering
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-ex-05/checks.json
  starterSql: |
    -- Hver vare skal beholde sin egen række.
---

# Opgave E — Vinduesfunktioner

Caféen vil kende varernes placering på både det normale menukort og en kampagneliste. Skriv din forventede rang ved to ens priser, før du laver listen.

## Del 1

Vis `name`, `category`, `price` og `nr`, hvor `nr` er `ROW_NUMBER()` inden for hver `category` sorteret med **dyreste først**. Sorter resultatet på `category`, derefter `nr`.

## Del 2

I kampagnerapporten koster Espresso midlertidigt **25.00**, det samme som Te. Beregn kampagneprisen i din SELECT med `CASE`. De øvrige varer beholder deres pris i rapporten, og menukortet skal blive i databasen som før. Vis `name` og `rang` for alle produkter. Brug `DENSE_RANK()` over kampagneprisen **stigende** (billigste = 1). Sortér på `rang`, derefter `name`.

Næste gang du laver en [topliste med WITH](/learn/joins-ex-03), så genskab forskellen på `RANK`, `DENSE_RANK` og `ROW_NUMBER` med tre priser fra hukommelsen.
