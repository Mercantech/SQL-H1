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

Raymond har to lister, der skal samles i én rapport. Her lægger vi resultater **under hinanden** med mængdeoperationer. Det er et andet arbejde end JOIN, som kombinerer oplysninger fra matchende rækker.

> [!RAYMOND:curious] Kan listerne passe sammen?
>
> Den ene SELECT leverer kundenavne, den anden produktnavne. Begge leverer én tekstkolonne. Hvad ville gå galt, hvis den ene i stedet leverede to kolonner?

## UNION — alle rækker (uden dubletter)

Kolonnerne skal have samme antal og kompatible typer:

```sql
SELECT name AS label FROM customers
UNION
SELECT name FROM products
ORDER BY label;
```

`UNION ALL` beholder dubletter og undgår arbejdet med at fjerne dem. Raymond vælger først ud fra, om gentagelser har betydning for svaret; en eventuel forskel i hastighed undersøges bagefter.

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

Sortér det samlede resultat med en afsluttende `ORDER BY`. Resultatets kolonnenavne kommer fra den **første** SELECT. En sortering eller begrænsning af en enkelt del kræver en tydeligt afgrænset del-forespørgsel.

> [!RAYMOND:skeptical] Er gentagelsen vigtig?
>
> To ens bynavne kan enten være en dublet, du vil fjerne, eller to registreringer, du vil beholde. Forklar, hvorfor UNION og UNION ALL kan besvare forskellige spørgsmål med de samme kildedata.

## Prøv selv

Lav en liste over alle bynavne fra `customers` plus den ekstra by `'Odense'` (brug `UNION`).
