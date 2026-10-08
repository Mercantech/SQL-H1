---
title: 5. Subqueries
slug: joins-05-subqueries
module: joins-subqueries
order: 5
kind: theory
objectives:
  - Bruge subquery i WHERE
  - Bruge subquery i FROM/SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT name, price
    FROM products
    WHERE price > (SELECT AVG(price) FROM products)
    ORDER BY price DESC;
---

# Subqueries

En **subquery** er en `SELECT` inde i en anden SQL-sætning.

## Skalar subquery (én værdi)

Produkter dyrere end gennemsnittet:

```sql
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price DESC;
```

## IN (liste)

Kunder der har bestilt **Espresso**:

```sql
SELECT name FROM customers
WHERE id IN (
  SELECT customer_id FROM orders
  WHERE product_id = (SELECT id FROM products WHERE name = 'Espresso')
)
ORDER BY name;
```

## Subquery i FROM

```sql
SELECT category, snit
FROM (
  SELECT category, AVG(price) AS snit
  FROM products
  GROUP BY category
) t
WHERE snit > 30
ORDER BY snit DESC;
```

## Correlated subquery

Subquery der refererer til den ydre række:

```sql
SELECT c.name,
  (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS antal
FROM customers c
ORDER BY antal DESC, c.name;
```

Ofte kan det omskrives til `JOIN` + `GROUP BY` — begge dele er nyttige.

## Prøv selv

Vis produkter med pris under gennemsnittet for **deres egen** kategori (correlated).
