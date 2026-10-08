---
title: 1. Nøgler og relationer
slug: relations-01-keys
module: relations
order: 1
kind: theory
objectives:
  - Skelne primær- og fremmednøgle
  - Læse relationer i et skema
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT
      o.id AS ordre,
      o.customer_id,
      c.name AS kunde,
      o.product_id,
      p.name AS produkt
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    ORDER BY o.id
    LIMIT 8;
---

# Nøgler og relationer

## Primærnøgle (PK)

Unikt identificerer en række. I café-databasen: `customers.id`, `products.id`, `orders.id`.

## Fremmednøgle (FK)

Peger på en PK i en anden tabel:

- `orders.customer_id` → `customers.id`
- `orders.product_id` → `products.id`

Det er det, der gør `JOIN` muligt — og det, der forhindrer “forældreløse” ordrer.

## Se relationen i data

```sql
SELECT o.id, c.name, p.name, o.quantity
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
ORDER BY o.id;
```

Du **skriver ikke** CREATE TABLE i MVP — men du skal kunne **læse** og bruge nøglerne korrekt i SELECT/DML.
