---
title: 2. INNER JOIN
slug: joins-02-inner
module: joins-subqueries
order: 2
kind: theory
objectives:
  - Skrive INNER JOIN
  - Bruge tabel-aliasser
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.name AS kunde, p.name AS produkt, o.quantity, o.order_date
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    INNER JOIN products p ON p.id = o.product_id
    ORDER BY o.order_date, c.name;
---

# INNER JOIN

`INNER JOIN` returnerer kun rækker, hvor nøglerne **matcher** i begge tabeller. Alt uden match forsvinder.

## Visuelt: hvad overlever?

Vælg **INNER** og se, at Clara (uden ordrer) ikke findes i resultatet. Skift til LEFT for at sammenligne.

```join-viz
types
```

## Syntaks

```sql
SELECT c.name AS kunde, p.name AS produkt, o.quantity
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN products p ON p.id = o.product_id;
```

## Aliasser

`o`, `c`, `p` er korte navne for tabellerne. Brug dem foran kolonner, når navne kolliderer (`name` findes i både kunder og produkter).

## Filter + JOIN

```sql
SELECT c.name, p.name AS produkt, o.quantity
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
WHERE c.city = 'Viborg'
ORDER BY c.name, p.name;
```

`JOIN` uden ord betyder typisk `INNER JOIN` i PostgreSQL.

## Linjetotal

```sql
SELECT c.name, p.name, o.quantity, p.price,
       o.quantity * p.price AS linje_total
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
ORDER BY linje_total DESC;
```

## Prøv selv

Vis alle ordrer med kundenavn og produktnavn for ordrer med `quantity >= 2`.
