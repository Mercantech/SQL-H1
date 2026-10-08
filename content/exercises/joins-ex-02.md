---
title: Opgave B — LEFT JOIN og EXISTS
slug: joins-ex-02
module: joins-subqueries
order: 11
kind: exercise
objectives:
  - LEFT JOIN
  - EXISTS
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/joins-ex-02/checks.json
  starterSql: |
    SELECT p.name
    FROM products p
    LEFT JOIN orders o ON o.product_id = p.id
    WHERE o.id IS NULL
    ORDER BY p.name;
---

# Opgave B — LEFT JOIN og EXISTS

## Del 1

Vis navne på produkter der **ikke** har nogen ordre. Sorter på `name`.

## Del 2

Vis antal ordrer pr. produkt (`name`, `antal`), inkl. produkter med 0 ordrer. Sorter på `antal`, derefter `name`.

## Del 3

Vis kundenavne for kunder der har bestilt mindst én **Drikke** (brug `EXISTS` eller `IN`). Sorter på `name`.
