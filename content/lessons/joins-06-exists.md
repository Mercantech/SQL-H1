---
title: 6. EXISTS og NOT EXISTS
slug: joins-06-exists
module: joins-subqueries
order: 6
kind: theory
objectives:
  - Bruge EXISTS til “findes mindst én”
  - Vælge mellem IN og EXISTS
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT name FROM customers c
    WHERE EXISTS (
      SELECT 1 FROM orders o WHERE o.customer_id = c.id
    )
    ORDER BY name;
---

# EXISTS og NOT EXISTS

`EXISTS` er sand, hvis subqueryen returnerer **mindst én** række.

## Kunder med ordrer

```sql
SELECT name FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY name;
```

## Kunder uden ordrer

```sql
SELECT name FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY name;
```

(I seed-dataen har alle kunder ordrer — prøv at slette nogle i Playground, eller brug `LEFT JOIN … IS NULL`.)

## EXISTS vs IN

- `IN` er klar ved små lister  
- `EXISTS` stopper ofte tidligere og håndterer `NULL` mere forudsigeligt i komplekse tilfælde

## Produkter bestilt af Viborg-kunder

```sql
SELECT DISTINCT p.name
FROM products p
WHERE EXISTS (
  SELECT 1
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  WHERE o.product_id = p.id AND c.city = 'Viborg'
)
ORDER BY p.name;
```

## Prøv selv

List kategorier hvor der **findes** mindst ét udsolgt produkt (`NOT in_stock`).
