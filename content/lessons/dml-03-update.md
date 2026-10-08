---
title: 3. UPDATE i dybden
slug: dml-03-update
module: dml
order: 3
kind: theory
objectives:
  - Opdatere med WHERE
  - Opdatere flere kolonner
  - Bruge subqueries i UPDATE
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    UPDATE products
    SET price = price * 1.10
    WHERE category = 'Drikke';
---

# UPDATE i dybden

## Grundform

```sql
UPDATE products
SET price = 30.00
WHERE name = 'Espresso';
```

**Uden `WHERE` opdateres alle rækker** — pas på.

## Flere kolonner

```sql
UPDATE products
SET price = 26.00, in_stock = TRUE
WHERE name = 'Te';
```

## Udtryk

```sql
UPDATE products
SET price = ROUND(price * 1.10, 2)
WHERE category = 'Drikke';
```

## Med subquery

Sæt alle produkter i samme kategori som Espresso til udsolgt:

```sql
UPDATE products
SET in_stock = FALSE
WHERE category = (
  SELECT category FROM products WHERE name = 'Espresso'
);
```

## RETURNING

```sql
UPDATE products
SET price = 33.00
WHERE name = 'Latte'
RETURNING name, price;
```

## Prøv selv

Giv alle produkter i **`Mad`** en prisforhøjelse på **2.00** kr.
