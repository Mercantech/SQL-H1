---
title: 1. Constraints i praksis
slug: constraints-01-intro
module: constraints
order: 1
kind: theory
objectives:
  - Kende NOT NULL, UNIQUE, CHECK, FK
  - Se effekten uden at oprette constraints
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    INSERT INTO products (name, category, price) VALUES (NULL, 'Drikke', 10);
---

# Constraints i praksis

En **constraint** er en regel databasen håndhæver. I café-seed’en er bl.a.:

| Regel | Eksempel |
|-------|----------|
| `NOT NULL` | `customers.name`, `products.price` |
| `PRIMARY KEY` | `id`-kolonner |
| `REFERENCES` (FK) | `orders.customer_id` → `customers` (må være `NULL` = walk-in) |

Du må **ikke** køre `ALTER TABLE` i MVP — men du kan **mærke** reglerne.

## NOT NULL

Prøv (skal fejle):

```sql
INSERT INTO products (name, category, price)
VALUES (NULL, 'Drikke', 10);
```

## Fremmednøgle

Ugyldigt kunde-id fejler (kunden findes ikke):

```sql
INSERT INTO orders (customer_id, product_id, quantity, order_date)
VALUES (999, 1, 1, '2024-05-01');
```

Walk-in er OK — `customer_id` må være `NULL` (anonym ordre):

```sql
INSERT INTO orders (customer_id, product_id, quantity, order_date)
VALUES (NULL, 1, 1, '2024-05-01');
```

## Hvorfor constraints?

De beskytter **konsistens**: ingen ordrer med *ugyldig* kunde, ingen produkter uden navn. `NULL` betyder “ingen kunde knyttet” — nyttigt til FULL/RIGHT JOIN. Det er samme idé som validering i applikationskode — bare tættere på dataene.
