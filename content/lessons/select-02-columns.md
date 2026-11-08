---
title: 2. Kolonner, alias og DISTINCT
slug: select-02-columns
module: select
order: 2
kind: theory
objectives:
  - Vælge bestemte kolonner
  - Give kolonner alias med AS
  - Fjerne dubletter med DISTINCT
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: SELECT name AS kundenavn, city AS bynavn FROM customers;
---

# Kolonner, alias og DISTINCT

Raymond skal lave en enkel kundeliste til caféens skranke. Der er brug for navn og by, men ikke alle oplysninger i kundetabellen. Nu bestemmer du både indholdet og overskrifterne i resultatet.

> [!RAYMOND:reading] Bestil kun de oplysninger, du skal bruge
>
> Hvis jeg vælger `city, name` i stedet for `name, city`, hvad ændrer sig så? Forudsig resultatets overskrifter og rækkefølge, inden du kører.

## Vælg bestemte kolonner

```sql
SELECT name, city FROM customers;
```

Rækkefølgen i `SELECT` er rækkefølgen i resultatet.

## Alias med AS

Giv kolonner mere læsbare navne:

```sql
SELECT name AS kundenavn, city AS bynavn
FROM customers;
```

Raymond læser `AS kundenavn` som en overskrift på rapporten. Aliaset ændrer navnet i **resultatet**; kolonnen i `customers` hedder stadig `name`. `AS` kan udelades her, men hjælper os med at læse SQL’en.

## DISTINCT — unikke værdier

```sql
SELECT DISTINCT city FROM customers;
SELECT DISTINCT category FROM products;
```

`DISTINCT` fjerner ens **resultatrækker**. Vælger du flere kolonner, sammenlignes kombinationen af dem alle; det er ikke kun den første kolonne, der skal være ens.

> [!RAYMOND:skeptical] Er det samme by eller samme række?
>
> To kunder kan begge bo i Viborg. Hvorfor kan `SELECT DISTINCT city` samle dem, mens `SELECT DISTINCT name, city` normalt stadig viser to rækker? Forklar, hvilke værdier databasen sammenligner.

## Prøv selv

1. Vis kun `name` og `price` fra `products`.
2. Vis unikke kategorier fra `products`.
3. Vis `name AS vare` og `price AS pris`.
