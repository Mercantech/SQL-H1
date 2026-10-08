---
title: 4. Flere tabeller og self-join
slug: joins-04-multi
module: joins-subqueries
order: 4
kind: theory
objectives:
  - Joine tre eller flere tabeller
  - Aggregere over joins
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.city, SUM(o.quantity * p.price) AS omsaetning
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    GROUP BY c.city
    ORDER BY omsaetning DESC;
---

# Flere tabeller og aggregering

En ordre kender kun id’er. For at få *navne* skal du joine **to** gange: først kunden, så produktet.

## Følg en ordre gennem kæden

Vælg en ordre og se, hvordan `customer_id` og `product_id` binder tabellerne sammen.

```join-viz
chain
```

## Omsætning pr. by

```sql
SELECT c.city, SUM(o.quantity * p.price) AS omsaetning
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
GROUP BY c.city
ORDER BY omsaetning DESC;
```

## Topkunder

```sql
SELECT c.name, COUNT(*) AS ordrer, SUM(o.quantity) AS stk
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.name
ORDER BY stk DESC, c.name;
```

## Samme tabel to gange? (self-join)

I café-dataen er self-join sjældent nødvendig. Mønsteret er:

```sql
SELECT a.name, b.name
FROM customers a
JOIN customers b ON a.city = b.city AND a.id < b.id;
```

Det finder kundekombinationer i samme by.

## Prøv selv

Vis kategori og samlet omsætning (`SUM(quantity * price)`) pr. `category`.
