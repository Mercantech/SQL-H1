---
title: 3. Views oven på views
slug: views-03-compose
module: views
order: 3
kind: theory
objectives:
  - Bygge views i lag
  - Bruge aggregation i views
  - Kende dependency ved DROP
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE VIEW v_order_lines AS
    SELECT
      o.id AS order_id,
      COALESCE(c.name, 'Walk-in') AS kunde,
      p.name AS produkt,
      p.category,
      o.quantity,
      (o.quantity * p.price) AS linje_beloeb,
      o.order_date
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id;

    CREATE OR REPLACE VIEW v_sales_by_category AS
    SELECT category, SUM(linje_beloeb) AS omsaetning, COUNT(*) AS linjer
    FROM v_order_lines
    GROUP BY category;

    SELECT * FROM v_sales_by_category ORDER BY omsaetning DESC;
---

# Views oven på views

I store systemer bygger man ofte et **lag**:

```text
basistabeller → detalje-view → aggregat-view → rapport/API
```

## Lag 1 — detalje

```sql
CREATE OR REPLACE VIEW v_order_lines AS
SELECT
  o.id AS order_id,
  COALESCE(c.name, 'Walk-in') AS kunde,
  p.name AS produkt,
  p.category,
  o.quantity,
  (o.quantity * p.price) AS linje_beloeb,
  o.order_date
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id;
```

## Lag 2 — aggregat

```sql
CREATE OR REPLACE VIEW v_sales_by_category AS
SELECT
  category,
  SUM(linje_beloeb) AS omsaetning,
  COUNT(*) AS linjer
FROM v_order_lines
GROUP BY category;

SELECT * FROM v_sales_by_category ORDER BY omsaetning DESC;
```

## DROP og afhængigheder

```sql
DROP VIEW v_order_lines;  -- fejler hvis v_sales_by_category stadig findes
DROP VIEW v_sales_by_category;
DROP VIEW v_order_lines;
-- eller: DROP VIEW v_order_lines CASCADE;  -- fjerner også afhængige
```

## Til API’en

Appen kan `SELECT` fra `v_sales_by_category` uden at kende JOIN-detaljerne — stabilt “read model”. Skriv stadig til basistabellerne.

## Versionering af views

Når kontrakten ændrer sig:

```sql
CREATE OR REPLACE VIEW v_sales_by_category AS
  -- ny definition
  ...
```

`OR REPLACE` kan fejle, hvis kolonner ændrer type/rækkefølge på en måde Postgres ikke kan. Så: `DROP VIEW … CASCADE` (pas på!) og opret forfra — eller opret `v_sales_by_category_v2` og migrér API’en.

## Afhængighedsgraf

```text
orders + products + customers
        ↓
  v_order_lines
        ↓
  v_sales_by_category
```

Ændrer I basistabeller (omdøb kolonne), knækker views. Derfor: E/R + views høører sammen i review.

## Prøv selv

1. Byg begge lag.  
2. Ændr noget i `v_order_lines` og se effekten i aggregatet.  
3. Prøv `DROP VIEW v_order_lines` uden at droppe barnet — læs fejlen.
