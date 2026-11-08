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

Raymond vil give menuens varer en prisgruppe, så rapporten er nemmere at læse. `CASE` vælger en **værdi** ud fra betingelser — beslægtet med `if/else`, men her som et udtryk inde i forespørgslen.

> [!RAYMOND:question] Et nyt felt eller færre varer?
>
> Når jeg tilføjer en kolonne med `CASE`, skal varerne så forsvinde fra listen? Skeln mellem at beregne en etiket med CASE og at vælge rækker med WHERE.

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

Raymond læser betingelserne oppefra. Den første sande `WHEN` bestemmer værdien. Derfor får en vare til præcis 30 kr. ikke etiketten `billig` i eksemplet. Uden en matchende gren og uden `ELSE` bliver resultatet `NULL`.

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

> [!RAYMOND:thinking] Følg én række gennem beslutningen
>
> Vælg en pris på en af grænserne, 30 eller 45. Gå gennem WHEN-grenene i rækkefølge, og forklar den valgte etiket. Gør bagefter det samme for en lagerført og en udsolgt vare.

## Prøv selv

Vis alle produkter med en kolonne `status`: `'udsolgt'` hvis `in_stock` er false, ellers `'klar'`.
