---
title: Opgave E — Vinduesfunktioner
slug: select-ex-05
module: select
order: 14
kind: exercise
objectives:
  - ROW_NUMBER pr. partition
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/select-ex-05/checks.json
  starterSql: |
    SELECT name, category, price,
      ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS nr
    FROM products
    ORDER BY category, nr;
---

# Opgave E — Vinduesfunktioner

## Del 1

Vis `name`, `category`, `price` og `nr`, hvor `nr` er `ROW_NUMBER()` inden for hver `category` sorteret med **dyreste først**. Sorter resultatet på `category`, derefter `nr`.

## Del 2

Vis `name` og `rang` for alle produkter, hvor `rang` er `DENSE_RANK()` over hele tabellen sorteret på `price` **stigende** (billigste = 1). Sorter på `rang`, derefter `name`.
