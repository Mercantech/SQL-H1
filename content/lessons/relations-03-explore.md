---
title: 3. Udforsk relationerne
slug: relations-03-explore
module: relations
order: 3
kind: theory
objectives:
  - Udlede relationer via forespørgsler
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT p.name, COUNT(DISTINCT o.customer_id) AS antal_kunder
    FROM products p
    LEFT JOIN orders o ON o.product_id = p.id
    GROUP BY p.name
    ORDER BY antal_kunder DESC, p.name;
---

# Udforsk relationerne

## Hvor populært er hvert produkt?

```sql
SELECT p.name, COUNT(DISTINCT o.customer_id) AS antal_kunder
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
GROUP BY p.name
ORDER BY antal_kunder DESC, p.name;
```

## Hvilke kunder deler samme by og har begge handlet?

```sql
SELECT a.name AS kunde_a, b.name AS kunde_b, a.city
FROM customers a
JOIN customers b ON a.city = b.city AND a.id < b.id
ORDER BY a.city, kunde_a;
```

## “Hvem har købt det samme som Anna?”

```sql
SELECT DISTINCT c.name
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.product_id IN (
  SELECT product_id FROM orders
  WHERE customer_id = (SELECT id FROM customers WHERE name = 'Anna Jensen')
)
AND c.name <> 'Anna Jensen'
ORDER BY c.name;
```

Brug emulatoren frit — målet er at **tænke i nøgler**, ikke kun i enkelte tabeller.
