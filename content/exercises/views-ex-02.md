---
title: Opgave B — Salg pr. kategori
slug: views-ex-02
module: views
order: 11
kind: exercise
objectives:
  - View med aggregation
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/views-ex-02/checks.json
  starterSql: |
    CREATE OR REPLACE VIEW v_order_lines AS
    SELECT
      o.id AS order_id,
      p.category,
      (o.quantity * p.price) AS linje_beloeb
    FROM orders o
    JOIN products p ON p.id = o.product_id;
---

# Opgave B — Salg pr. kategori

## Krav

1. Sørg for et view **`v_order_lines`** der mindst har `category` og `linje_beloeb` (`quantity * price`).

2. Opret **`v_sales_by_category`** med kolonnerne:
   - `category`
   - `omsaetning` = `SUM(linje_beloeb)`
   - `linjer` = `COUNT(*)`

`v_sales_by_category` skal læse fra `v_order_lines` (ikke joine basistabellerne direkte).
