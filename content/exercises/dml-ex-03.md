---
title: Opgave C — DELETE og RETURNING
slug: dml-ex-03
module: dml
order: 12
kind: exercise
objectives:
  - Slette flere rækker sikkert
  - Rydde op omkring fremmednøgler
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/dml-ex-03/checks.json
  starterSql: |
    DELETE FROM orders WHERE product_id = (
      SELECT id FROM products WHERE name = 'Chokoladebolle'
    );
---

# Opgave C — DELETE og fremmednøgler

**Chokoladebolle** er udsolgt og skal fjernes helt.

## Del 1

Slet **alle ordrer** der refererer til produktet **Chokoladebolle**.

## Del 2

Slet derefter selve produktet **Chokoladebolle**.

## Del 3

Slet alle ordrer med `order_date = '2024-04-01'`.
