---
title: Opgave — Ordreoversigt som view
slug: views-ex-01
module: views
order: 10
kind: exercise
objectives:
  - CREATE VIEW med JOIN
  - Forespørge via view
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/views-ex-01/checks.json
  starterSql: |
    CREATE OR REPLACE VIEW v_order_lines AS
    SELECT
      o.id AS order_id,
      COALESCE(c.name, 'Walk-in') AS kunde,
      p.name AS produkt,
      o.quantity,
      (o.quantity * p.price) AS linje_beloeb,
      o.order_date
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id;
---

# Opgave — Ordreoversigt som view

## Krav

1. Opret (eller erstat) view’et **`v_order_lines`** med kolonnerne:
   - `order_id` — `orders.id`
   - `kunde` — kundenavn, eller teksten **`Walk-in`** når `customer_id` er `NULL` (`COALESCE`)
   - `produkt` — produktnavn
   - `quantity`
   - `linje_beloeb` — `quantity * price`
   - `order_date`

2. View’et skal inkludere **walk-in**-ordrer (`LEFT JOIN` på customers).

Tryk **Tjek svar**, når det er på plads.
