---
title: Opgave D — Anti-join
slug: joins-ex-04
module: joins-subqueries
order: 13
kind: exercise
objectives:
  - NOT EXISTS / anti-join
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/joins-ex-04/checks.json
  starterSql: |
    SELECT c.name
    FROM customers c
    WHERE NOT EXISTS (
      SELECT 1 FROM orders o WHERE o.customer_id = c.id
    )
    ORDER BY c.name;
---

# Opgave D — Anti-join

## Del 1

Find kunder **uden ordrer**. Returnér kun `name`, sorteret alfabetisk.

## Del 2

Find produkter der **aldrig** optræder i `orders`. Returnér `name` sorteret alfabetisk.
