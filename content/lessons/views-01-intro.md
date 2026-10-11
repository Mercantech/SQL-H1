---
title: 1. Views — gemte forespørgsler
slug: views-01-intro
module: views
order: 1
kind: theory
objectives:
  - Oprette og forespørge et VIEW
  - Forstå view som “virtuel tabel”
  - DROP / CREATE OR REPLACE VIEW
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE VIEW v_customer_orders AS
    SELECT c.name AS kunde, p.name AS produkt, o.quantity, o.order_date
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id;
    SELECT * FROM v_customer_orders ORDER BY order_date DESC LIMIT 10;
---

# Views — gemte forespørgsler

Et **view** er en navngiven `SELECT`, som Postgres udstiller som en tabel. Data ligger stadig i underliggende tabeller — view’et er et **vindue** ind i dem.

## Opret og brug

```sql
CREATE OR REPLACE VIEW v_customer_orders AS
SELECT
  c.name AS kunde,
  p.name AS produkt,
  o.quantity,
  o.order_date
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id;

SELECT * FROM v_customer_orders
ORDER BY order_date DESC
LIMIT 10;
```

Du kan joine views, filtrere og aggregere — præcis som en tabel:

```sql
SELECT kunde, COUNT(*) AS antal_linjer
FROM v_customer_orders
GROUP BY kunde
ORDER BY antal_linjer DESC;
```

## Hvorfor views?

| Formål | Eksempel |
|--------|----------|
| **Forenkling** | Skjul komplekse JOIN’er for appen/rapporten |
| **Genbrug** | Samme “ordrelinje-udsnit” mange steder |
| **Sikkerhed** | Vis kun bestemte kolonner/rækker (næste lektion) |
| **Stabilt API** | Underliggende tabeller ændres; view-navnet bliver |

## DROP

```sql
DROP VIEW IF EXISTS v_customer_orders;
```

Hvis andre views afhænger af dette view, kan du få brug for `CASCADE` — tænk dig om.

## Updatable views?

Simple views (én tabel, ingen aggregation) kan nogle gange `INSERT`/`UPDATE` direkte. I praksis opdaterer man ofte **basistabellerne** og lader view’et være read-model. Til H1: **læs via views**, skriv via tabeller.

## View vs. tabel vs. CTE

| | View | Tabel | CTE (`WITH`) |
|--|------|-------|--------------|
| Gemt i kataloget | ja | ja | nej (pr. query) |
| Data på disk | nej* | ja | nej |
| Genbrug på tværs af queries | ja | ja | kun samme statement |

\*Materialized views er undtagelsen (egne lektion senere i tankerne — vi holder os til almindelige views).

## Navngivning

Prefix `v_` (eller `vw_`) gør det tydeligt i `SELECT` og i API-docs: *dette er et read-model*.

## Performance-note

Et view **cacher ikke** automatisk. Tunge views kørt ofte → overvej indeks på basistabeller, forenkling af SQL, eller (senere) materialized view.

## Prøv selv

1. Lav `v_product_sales` med produktnavn, kategori og `SUM(quantity)`.  
2. Forespørg de 3 mest solgte.  
3. Forklar forskellen på view og CTE til en makker.
