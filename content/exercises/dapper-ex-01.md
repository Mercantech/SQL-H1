---
title: Opgave — Rapport-SQL til Dapper
slug: dapper-ex-01
module: dapper
order: 10
kind: exercise
objectives:
  - JOIN-forespørgsel som DTO-grundlag
  - Aggregering til dashboard
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  checks: exercises/dapper-ex-01/checks.json
  starterSql: |
    SELECT
      c.name AS kunde,
      p.name AS produkt,
      o.quantity
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    WHERE c.city = 'Aarhus'
    ORDER BY c.name, p.name;
---

# Opgave — Rapport-SQL til Dapper

I skal levere den SQL, Dapper ville `QueryAsync`’e til to endpoints.

## Del 1

For kunder i **Aarhus**: vis `kunde`, `produkt`, `quantity` (INNER JOIN — ingen walk-in). Sorter på `kunde`, derefter `produkt`.

## Del 2

Vis pr. `category`: `category` og `antal_ordrelinjer` (`COUNT` af ordrer på produkter i kategorien). Sorter på `category`.
