---
title: 8. UNION, INTERSECT og EXCEPT
slug: select-08-set-ops
module: select
order: 8
kind: theory
objectives:
  - Kombinere resultatsæt med UNION
  - Forstå INTERSECT og EXCEPT
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT city FROM customers
    UNION
    SELECT 'København';
---

# UNION, INTERSECT og EXCEPT

Nogle gange skal du **sammensætte** flere `SELECT`-resultater til ét.

## UNION — alle rækker (uden dubletter)

Kolonnerne skal have samme antal og kompatible typer:

```sql
SELECT name AS label FROM customers
UNION
SELECT name FROM products
ORDER BY label;
```

`UNION ALL` beholder dubletter og er ofte hurtigere.

```sql
SELECT city FROM customers WHERE city = 'Viborg'
UNION ALL
SELECT city FROM customers WHERE city = 'Viborg';
```

## INTERSECT — kun fælles rækker

```sql
SELECT city FROM customers
INTERSECT
SELECT 'Viborg';
```

## EXCEPT — i venstre, men ikke i højre

```sql
SELECT city FROM customers
EXCEPT
SELECT 'Aarhus';
```

## Tip

Sortering sker typisk **efter** hele mængdeoperationen. Brug kolonnenavne fra den **første** `SELECT`.

## Prøv selv

Lav en liste over alle bynavne fra `customers` plus den ekstra by `'Odense'` (brug `UNION`).
