---
title: Opgave — Funktionsbaseret linjebeløb
slug: procedures-ex-01
module: procedures
order: 10
kind: exercise
objectives:
  - CREATE FUNCTION
  - Kalde funktionen i SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/procedures-ex-01/checks.json
  starterSql: |
    CREATE OR REPLACE FUNCTION order_line_total(p_order_id INT)
    RETURNS NUMERIC
    LANGUAGE sql
    STABLE
    AS $$
      SELECT o.quantity * p.price
      FROM orders o
      JOIN products p ON p.id = o.product_id
      WHERE o.id = p_order_id;
    $$;
---

# Opgave — Funktionsbaseret linjebeløb

## Krav

1. Opret funktionen **`order_line_total(p_order_id INT)`**, der returnerer `NUMERIC`:  
   `quantity * price` for den angivne ordre.

2. Funktionen skal virke for eksisterende ordrer (join `orders` + `products`).

Tryk **Tjek svar**.
