---
title: 4. Sortering med ORDER BY
slug: select-04-order
module: select
order: 4
kind: theory
objectives:
  - Sortere med ORDER BY
  - Bruge ASC, DESC og LIMIT
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: SELECT name, price FROM products ORDER BY price DESC;
---

# Sortering med ORDER BY

Uden `ORDER BY` er rækkefølgen ikke garanteret. Sortér eksplicit:

```sql
SELECT name, price
FROM products
ORDER BY price ASC;   -- billigste først (ASC er standard)

SELECT name, price
FROM products
ORDER BY price DESC;  -- dyreste først
```

## Flere sorteringsnøgler

```sql
SELECT name, category, price
FROM products
ORDER BY category ASC, price DESC;
```

Først grupperes/sorteres på kategori, derefter pris inden for hver kategori.

## LIMIT

Vis kun de første N rækker (efter sortering):

```sql
SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 3;
```

## Kombiner med WHERE

```sql
SELECT name, price
FROM products
WHERE category = 'Drikke'
ORDER BY price DESC;
```

## Prøv selv

Vis de 2 dyreste produkter i kategorien `Bagværk`.
