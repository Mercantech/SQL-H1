---
title: 3. Filtrering med WHERE
slug: select-03-where
module: select
order: 3
kind: theory
objectives:
  - Filtrere rækker med WHERE
  - Bruge AND, OR, IN, BETWEEN, LIKE og IS NULL
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: SELECT name, city FROM customers WHERE city = 'Viborg';
---

# Filtrering med WHERE

`WHERE` begrænser hvilke **rækker** der kommer med.

## Sammenligninger

```sql
SELECT name, price FROM products WHERE price > 30;
SELECT name, city FROM customers WHERE city = 'Viborg';
SELECT name, price FROM products WHERE price <> 25;
```

| Operator | Betydning |
|----------|-----------|
| `=` | lig med |
| `<>` eller `!=` | forskellig fra |
| `<` `>` `<=` `>=` | mindre/større |

## AND / OR

```sql
SELECT name, category, price
FROM products
WHERE category = 'Drikke' AND price >= 30;

SELECT name, city
FROM customers
WHERE city = 'Viborg' OR city = 'Aarhus';
```

## IN, BETWEEN, LIKE

```sql
SELECT name, city FROM customers WHERE city IN ('Viborg', 'Aarhus');
SELECT name, price FROM products WHERE price BETWEEN 20 AND 40;
SELECT name FROM customers WHERE name LIKE 'A%';   -- starter med A
SELECT name FROM customers WHERE name LIKE '%sen'; -- ender på sen
```

## NULL

`NULL` betyder “mangler værdi”. Brug aldrig `= NULL`:

```sql
SELECT name, email FROM customers WHERE email IS NULL;
SELECT name, email FROM customers WHERE email IS NOT NULL;
```

## Prøv selv

Find produkter i kategorien `Mad` der koster mere end 45 kr.
