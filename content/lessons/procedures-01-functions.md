---
title: 1. Funktioner i Postgres
slug: procedures-01-functions
module: procedures
order: 1
kind: theory
objectives:
  - Oprette SQL- og plpgsql-funktioner
  - Skelne RETURNS TABLE / skalar
  - Kalde funktioner fra SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
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
    SELECT id, order_line_total(id) AS total FROM orders ORDER BY id LIMIT 5;
---

# Funktioner i Postgres

En **funktion** pakker logik, du vil genbruge: beregning, opslag eller et lille “API” inde i databasen.

## Skalar funktion (SQL-sprog)

```sql
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

SELECT id, order_line_total(id) AS total
FROM orders
ORDER BY id
LIMIT 5;
```

`$…$` er **dollar-quoting** — så semikolon inde i kroppen ikke afslutter `CREATE`.

## RETURNS TABLE

```sql
CREATE OR REPLACE FUNCTION top_products(p_limit INT)
RETURNS TABLE(produkt TEXT, antal BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT p.name, SUM(o.quantity)::bigint
  FROM orders o
  JOIN products p ON p.id = o.product_id
  GROUP BY p.name
  ORDER BY SUM(o.quantity) DESC
  LIMIT p_limit;
$$;

SELECT * FROM top_products(3);
```

## plpgsql — når du skal bruge IF

```sql
CREATE OR REPLACE FUNCTION city_tier(p_city TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_city IN ('Aarhus', 'Aalborg') THEN
    RETURN 'Storby';
  ELSIF p_city = 'Viborg' THEN
    RETURN 'Lokal';
  ELSE
    RETURN 'Anden';
  END IF;
END;
$$;

SELECT name, city, city_tier(city) FROM customers;
```

## DROP

```sql
DROP FUNCTION IF EXISTS order_line_total(INT);
DROP FUNCTION IF EXISTS top_products(INT);
```

I Postgres kan flere funktioner dele navn med forskellige argumenttyper — derfor angiver man ofte signaturen ved `DROP`.
