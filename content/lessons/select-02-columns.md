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

`AS` er valgfri, men gør SQL’en lettere at læse.

## DISTINCT — unikke værdier

```sql
SELECT DISTINCT city FROM customers;
SELECT DISTINCT category FROM products;
```

`DISTINCT` fjerner dubletter i resultatet.

## Prøv selv

1. Vis kun `name` og `price` fra `products`.
2. Vis unikke kategorier fra `products`.
3. Vis `name AS vare` og `price AS pris`.
