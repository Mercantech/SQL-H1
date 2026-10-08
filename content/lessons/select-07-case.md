---
title: 7. CASE og betingede værdier
slug: select-07-case
module: select
order: 7
kind: theory
objectives:
  - Skrive CASE-udtryk
  - Klassificere rækker i SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT name, price,
      CASE
        WHEN price < 30 THEN 'billig'
        WHEN price < 45 THEN 'mellem'
        ELSE 'dyr'
      END AS prisniveau
    FROM products
    ORDER BY price;
---

# CASE og betingede værdier

`CASE` vælger en værdi ud fra betingelser — som `if/else` i SQL.

## Simpel form

```sql
SELECT name,
  CASE category
    WHEN 'Drikke' THEN '🍹'
    WHEN 'Mad' THEN '🥪'
    ELSE 'andet'
  END AS ikon
FROM products;
```

## Søgt form (mest brugt)

```sql
SELECT name, price,
  CASE
    WHEN price < 30 THEN 'billig'
    WHEN price < 45 THEN 'mellem'
    ELSE 'dyr'
  END AS prisniveau
FROM products
ORDER BY price;
```

## Med aggregater

```sql
SELECT
  COUNT(*) FILTER (WHERE in_stock) AS pa_lager,
  COUNT(*) FILTER (WHERE NOT in_stock) AS udsolgt
FROM products;
```

Eller med `CASE` inde i `SUM`/`COUNT`:

```sql
SELECT
  SUM(CASE WHEN in_stock THEN 1 ELSE 0 END) AS pa_lager,
  SUM(CASE WHEN NOT in_stock THEN 1 ELSE 0 END) AS udsolgt
FROM products;
```

## Prøv selv

Vis alle produkter med en kolonne `status`: `'udsolgt'` hvis `in_stock` er false, ellers `'klar'`.
