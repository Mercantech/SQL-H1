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

Raymond vil finde bestemte varer på caféens menu. `SELECT` vælger oplysningerne, mens `WHERE` afgør, hvilke **rækker** der må komme med. Beskriv først dit krav med ord, og oversæt det derefter til en betingelse.

> [!RAYMOND:filter] Skal varen med på listen?
>
> Vi søger varer med `price > 30`. Forestil dig en vare til præcis 30 kr.: Kommer den med? En enkelt ændring fra `>` til `>=` ændrer vores grænse.

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

Raymond læser `AND` som, at begge krav skal holde, og `OR` som, at mindst ét skal holde. Brug parenteser, når du blander dem, så din hensigt er tydelig. `AND` binder tættere end `OR`.

## IN, BETWEEN, LIKE

```sql
SELECT name, city FROM customers WHERE city IN ('Viborg', 'Aarhus');
SELECT name, price FROM products WHERE price BETWEEN 20 AND 40;
-- Starter med A
SELECT name FROM customers WHERE name LIKE 'A%';
-- Ender på sen
SELECT name FROM customers WHERE name LIKE '%sen';
```

`BETWEEN 20 AND 40` tager begge endepunkter med. I `LIKE` betyder `%` nul eller flere tegn; det er derfor placeringen af tegnet ændrer søgningen.

## NULL

`NULL` betyder “mangler værdi”. Brug aldrig `= NULL`:

```sql
SELECT name, email FROM customers WHERE email IS NULL;
SELECT name, email FROM customers WHERE email IS NOT NULL;
```

> [!RAYMOND:question] Hvad betyder en manglende e-mail?
>
> Når en e-mail er `NULL`, kender vi ikke en almindelig tekstværdi at sammenligne med. Derfor spørger vi `IS NULL`. Kan du forklare, hvorfor det ikke er det samme spørgsmål som, om e-mailen er en tom tekst?

## Prøv selv

Find produkter i kategorien `Mad` der koster mere end 45 kr.
