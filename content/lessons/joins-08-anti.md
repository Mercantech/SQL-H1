---
title: 8. Anti-join — “find dem uden …”
slug: joins-08-anti
module: joins-subqueries
order: 8
kind: theory
objectives:
  - Finde rækker uden match (anti-join)
  - Vælge mellem NOT EXISTS og LEFT JOIN … IS NULL
  - Anvende mønsteret på café-data
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.name, c.city
    FROM customers c
    WHERE NOT EXISTS (
      SELECT 1 FROM orders o WHERE o.customer_id = c.id
    )
    ORDER BY c.name;
---

# Anti-join — “find dem uden …”

En **anti-join** finder rækker i A, der **ikke** har match i B. Klassisk: kunder uden ordrer, produkter der aldrig er solgt.

## NOT EXISTS (anbefalet)

```sql
SELECT c.name, c.city
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY c.name;
```

I seed’en: **Clara Holm** (ingen ordrer).

## LEFT JOIN … IS NULL

```sql
SELECT c.name, c.city
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.name;
```

Samme idé: behold venstre side, filtrer væk dem der fik et match.

## Produkter aldrig solgt

```sql
SELECT p.name, p.category
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.product_id = p.id
)
ORDER BY p.name;
```

## NOT IN og NULL — pas på

```sql
-- Farligt hvis subquery kan indeholde NULL
SELECT * FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);
```

Hvis `customer_id` kan være `NULL` (walk-in), bliver `NOT IN` upålideligt. Brug **`NOT EXISTS`** i stedet.

## Hvornår bruger I det i projektet?

- “Brugere uden ordrer” / “åbne tickets uden kommentarer”
- Oprydning: “lookup-værdier der ikke bruges”
- Rapporter: “produkter uden salg i perioden”
