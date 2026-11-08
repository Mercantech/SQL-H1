---
title: 3. Views oven på views
slug: views-03-compose
module: views
order: 3
kind: theory
objectives:
  - Bygge views i lag
  - Bruge aggregation i views
  - Kende dependency ved DROP
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE VIEW v_order_lines AS
    SELECT
      o.id AS order_id,
      COALESCE(c.name, 'Walk-in') AS kunde,
      p.name AS produkt,
      p.category,
      o.quantity,
      (o.quantity * p.price) AS linje_beloeb,
      o.order_date
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id;

    CREATE OR REPLACE VIEW v_sales_by_category AS
    SELECT category, SUM(linje_beloeb) AS omsaetning, COUNT(*) AS linjer
    FROM v_order_lines
    GROUP BY category;

    SELECT * FROM v_sales_by_category ORDER BY omsaetning DESC;
---

# Views oven på views

Caféen beder Raymond om både en detaljeret ordreoversigt og omsætning pr. kategori. Han lader et detalje-view beskrive linjerne og et andet view samle dem. Hvert lag får en opgave, som du kan kontrollere for sig:

```text
basistabeller → detalje-view → aggregat-view → rapport/API
```

> [!RAYMOND:question] Bevarer vi walk-in-ordren?
>
> Find `LEFT JOIN` og `COALESCE` i detaljelaget. Hvad sker der med en ordre uden kunde, og hvad ville en `INNER JOIN` ændre? Aggregatet bliver kun rigtigt i forhold til de linjer, som det første lag bevarer.

## Lag 1 — detalje

```sql
CREATE OR REPLACE VIEW v_order_lines AS
SELECT
  o.id AS order_id,
  COALESCE(c.name, 'Walk-in') AS kunde,
  p.name AS produkt,
  p.category,
  o.quantity,
  (o.quantity * p.price) AS linje_beloeb,
  o.order_date
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id;
```

Raymond bemærker, at linjebeløbet her beregnes med produktets **aktuelle pris**. Undervisningsmodellen har ikke et prissnapshot på ordren, så dette er ikke i sig selv en historisk korrekt faktureringsmodel.

## Lag 2 — aggregat

```sql
CREATE OR REPLACE VIEW v_sales_by_category AS
SELECT
  category,
  SUM(linje_beloeb) AS omsaetning,
  COUNT(*) AS linjer
FROM v_order_lines
GROUP BY category;

SELECT * FROM v_sales_by_category ORDER BY omsaetning DESC;
```

> [!RAYMOND:idea-notes] Hvilket lag afhænger af hvilket?
>
> Tegn en pil fra kategorirapporten til detalje-viewet. Hvis du vil fjerne detaljelaget, hvad skal du så gøre med rapporten? Læs en dependency-fejl som information om kontrakter, du er ved at bryde.

## DROP og afhængigheder

```sql
DROP VIEW v_order_lines;  -- fejler hvis v_sales_by_category stadig findes
DROP VIEW v_sales_by_category;
DROP VIEW v_order_lines;
-- eller: DROP VIEW v_order_lines CASCADE;  -- fjerner også afhængige
```

## Til API’en

Appen kan `SELECT` fra `v_sales_by_category` uden at kende JOIN-detaljerne — stabilt “read model”. Skriv stadig til basistabellerne.

## Versionering af views

Når kontrakten ændrer sig, kan formen se sådan ud. Skitsens `...` skal erstattes af en fuld `SELECT`, før kommandoen kan køres:

```sql
CREATE OR REPLACE VIEW v_sales_by_category AS
  -- ny definition
  ...
```

`CREATE OR REPLACE VIEW` kræver de eksisterende kolonnenavne, typer og rækkefølge bevaret; nye kolonner kan tilføjes til sidst. Hvis kontrakten skal ændres mere, planlægger Raymond eksempelvis et nyt `v_sales_by_category_v2` og flytter klienterne. `DROP ... CASCADE` kræver en plan for alle de afhængigheder, der fjernes.

## Afhængighedsgraf

```text
orders + products + customers
        ↓
  v_order_lines
        ↓
  v_sales_by_category
```

PostgreSQL registrerer afhængighederne mellem objekter. En simpel kolonneomdøbning i en basistabel behøver ikke ødelægge viewet, mens en kolonne med afhængige views normalt ikke kan droppes uden at håndtere dem. Gennemgå både databasestruktur og det resultat, som API’et forventer.

## Prøv selv

1. Byg begge lag.  
2. Ændr noget i `v_order_lines` og se effekten i aggregatet.  
3. Prøv `DROP VIEW v_order_lines` uden at droppe barnet — læs fejlen.

> [!RAYMOND:reading] Følg én ændring gennem begge lag
>
> Vælg en kategori og forklar dens sum ud fra detalje-viewets linjer. Hvad ændres i rapporten, hvis en produktpris ændres? Vis også, hvorfor `COUNT(*)` af ordrelinjer ikke er det samme som solgt antal `SUM(quantity)`.
