---
title: Opgave C — Subquery og WITH
slug: joins-ex-03
module: joins-subqueries
order: 12
kind: exercise
objectives:
  - Subqueries
  - CTE med WITH
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/joins-ex-03/checks.json
  starterSql: |
    WITH dyre AS (
      SELECT name, price FROM products
      WHERE price > (SELECT AVG(price) FROM products)
    )
    SELECT name, price FROM dyre ORDER BY price DESC;
---

# Opgave C — Subquery og WITH

## Del 1

Vis `name` og `price` for produkter dyrere end **gennemsnittet** af alle produkter. Sorter med dyreste først.

## Del 2

Brug en CTE `ranked` med `ROW_NUMBER()` pr. kategori (dyreste først). Vis de produkter hvor `nr = 1` (`name`, `category`, `price`). Sorter på `category`.

## Del 3

Vis kundenavne for kunder hvis **samlede** `quantity` på tværs af ordrer er mindst **4**. Sorter på `name`.
