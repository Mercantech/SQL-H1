---
title: 6. SQL-funktioner
slug: select-06-functions
module: select
order: 6
kind: theory
objectives:
  - Bruge streng-, tal- og datofunktioner
  - Håndtere NULL med COALESCE
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: SELECT UPPER(name) AS stort, LENGTH(name) AS tegn FROM customers;
---

# SQL-funktioner

Funktioner transformerer værdier i `SELECT` (og i `WHERE`/`ORDER BY`).

## Strenge

```sql
SELECT UPPER(name), LOWER(name), LENGTH(name)
FROM customers;

SELECT name || ' fra ' || city AS label
FROM customers;
```

## Tal

```sql
SELECT name, price, ROUND(price, 0) AS afrundet
FROM products;

SELECT name, price * 1.25 AS med_moms
FROM products;
```

## Dato

```sql
SELECT name, created_at,
       EXTRACT(YEAR FROM created_at) AS aar,
       EXTRACT(MONTH FROM created_at) AS maaned
FROM customers;
```

## COALESCE — erstat NULL

```sql
SELECT name, COALESCE(email, '(ingen e-mail)') AS email
FROM customers;
```

## Kombiner med filtrering

```sql
SELECT name, city
FROM customers
WHERE LOWER(city) = 'viborg';
```

## Prøv selv

Vis produktnavne i store bogstaver og prisen afrundet til hele kroner for kategorien `Drikke`.
