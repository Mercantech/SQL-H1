---
title: Opgave A — INNER JOIN
slug: joins-ex-01
module: joins-subqueries
order: 10
kind: exercise
objectives:
  - Joine customers, orders og products
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/joins-ex-01/checks.json
  starterSql: |
    SELECT c.name, p.name AS produkt, o.quantity
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    WHERE o.quantity >= 2
    ORDER BY c.name, p.name;
---

# Opgave A — INNER JOIN

## Del 1

Vis `name` (kunde), `produkt` (produktnavn) og `quantity` for alle ordrer med `quantity >= 2`. Sorter på kundenavn, derefter produktnavn.

## Del 2

Vis `kunde`, `produkt` og `linje_total` (`quantity * price`) for ordrer fra kunder i **Aarhus**. Sorter på `linje_total` faldende, derefter `kunde`.
