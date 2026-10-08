---
title: 7. WITH (CTE)
slug: joins-07-with
module: joins-subqueries
order: 7
kind: theory
objectives:
  - Skrive Common Table Expressions
  - Kæde flere CTE’er
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    WITH dyre AS (
      SELECT * FROM products WHERE price >= 40
    )
    SELECT name, price FROM dyre ORDER BY price DESC;
---

# WITH (CTE)

En **CTE** (*Common Table Expression*) er en navngiven midlertidig resultattabel til brug i den samme forespørgsel.

## Enkel CTE

```sql
WITH dyre AS (
  SELECT * FROM products WHERE price >= 40
)
SELECT name, price FROM dyre ORDER BY price DESC;
```

## Top 2 pr. kategori (vindue + CTE)

```sql
WITH ranked AS (
  SELECT name, category, price,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS nr
  FROM products
)
SELECT name, category, price
FROM ranked
WHERE nr <= 2
ORDER BY category, nr;
```

## Flere CTE’er

```sql
WITH linjer AS (
  SELECT o.customer_id, o.quantity * p.price AS beloeb
  FROM orders o
  JOIN products p ON p.id = o.product_id
),
pr_kunde AS (
  SELECT customer_id, SUM(beloeb) AS total
  FROM linjer
  GROUP BY customer_id
)
SELECT c.name, pr_kunde.total
FROM pr_kunde
JOIN customers c ON c.id = pr_kunde.customer_id
ORDER BY total DESC;
```

## WITH RECURSIVE (kort)

PostgreSQL understøtter rekursive CTE’er til hierarkier. Café-dataen har ikke et træ — husk bare at `WITH RECURSIVE` også starter med `WITH` og er tilladt i MVP.

## Prøv selv

Lav en CTE `viborg` med kunder i Viborg, og join den med deres ordrer.
