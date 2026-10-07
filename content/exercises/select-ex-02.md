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
    SELECT name, price
    FROM products
    WHERE category = 'Drikke'
    ORDER BY price DESC;
---

# Opgave B — Sortering og filtre

## Del 1

Vis `name` og `price` for alle **Drikke**, sorteret med **dyreste først**.

## Del 2

Vis de **3 billigste** produkter (`name`, `price`) — uanset kategori.

## Del 3

Vis kunder hvis navn ender på **sen** (`name`, `city`), sorteret på `name`.
