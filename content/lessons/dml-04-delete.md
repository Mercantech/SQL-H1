---
title: 4. DELETE i dybden
slug: dml-04-delete
module: dml
order: 4
kind: theory
objectives:
  - Slette med WHERE
  - Forstå fremmednøgle-fejl
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    DELETE FROM orders WHERE id = 14;
---

# DELETE i dybden

## Grundform

```sql
DELETE FROM orders WHERE id = 14;
```

## Slet ud fra betingelse

```sql
DELETE FROM orders
WHERE order_date < '2024-04-03';
```

## Fremmednøgler

Prøv:

```sql
DELETE FROM customers WHERE name = 'Anna Jensen';
```

Det fejler typisk, fordi Anna har ordrer i `orders`. Slet først ordrerne — eller lad være.

```sql
DELETE FROM orders WHERE customer_id = (
  SELECT id FROM customers WHERE name = 'Anna Jensen'
);
-- derefter kan kunden slettes
```

## RETURNING

```sql
DELETE FROM orders
WHERE quantity >= 3
RETURNING id, customer_id, quantity;
```

## Prøv selv

Slet alle ordrer med `quantity = 3`. Tjek med `SELECT` bagefter.
