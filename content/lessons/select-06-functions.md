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

Raymond har fået en rapport med blandede store og små bogstaver og priser med decimaler. SQL-funktioner kan beregne nye værdier til resultatet, så visningen bliver brugbar. De kan også indgå i filtre og sortering.

> [!RAYMOND:curious] Ændrer vi navnet i databasen?
>
> Forudsig, hvad `UPPER(name)` viser. Når du bagefter vælger `name` alene, forventer du så store bogstaver dér også? Et beregnet SELECT-resultat er ikke en UPDATE.

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

Raymond bruger `price * 1.25` som et regneeksempel: aliaset `med_moms` forudsætter, at udgangspunktet er en pris uden moms. Et kolonnenavn alene fortæller ikke, om den antagelse passer i et rigtigt system.

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

`COALESCE` vælger den første værdi, der ikke er `NULL`. Det gør rapporten læselig, men udfylder ikke den manglende e-mail i tabellen.

## Kombiner med filtrering

```sql
SELECT name, city
FROM customers
WHERE LOWER(city) = 'viborg';
```

> [!RAYMOND:eureka] Visning og data er to forskellige ting
>
> Jeg kan vise `(ingen e-mail)` uden at gemme den tekst som kundens adresse. Forklar forskellen på en beregnet resultatkolonne og en ændring af de gemte data. Hvornår ville en UPDATE være nødvendig?

## Prøv selv

Vis produktnavne i store bogstaver og prisen afrundet til hele kroner for kategorien `Drikke`.
