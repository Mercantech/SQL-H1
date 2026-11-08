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

Raymond laver den samme ordreoversigt til caféen flere gange. Han giver den et navn med et **view**, så kollegaen kan spørge til oversigten uden at skrive hele JOIN-kæden igen. Et almindeligt view gemmer definitionen; rækkerne kommer fra de underliggende tabeller.

> [!RAYMOND:question] Hvad sker der ved næste ordre?
>
> Hvis caféen indsætter en ordre efter oprettelsen af viewet, skal vi så kopiere data ind i viewet? Forudsig svaret ud fra, om et almindeligt view gemmer rækker eller en forespørgselsdefinition.

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

> [!RAYMOND:reading] Et navn ændrer ikke betydningen
>
> Kig på JOIN-betingelserne i viewets definition. En ordre uden kunde får ikke pludselig en kunde, fordi SELECT’en nu har et viewnavn. Kontrollér først detalje-forespørgslen, og giv den derefter et navn.

## Updatable views?

Simple views (én tabel, ingen aggregation) kan nogle gange `INSERT`/`UPDATE` direkte. I praksis opdaterer man ofte **basistabellerne** og lader view’et være read-model. Til H1: **læs via views**, skriv via tabeller.

## View vs. tabel vs. CTE

| | View | Tabel | CTE (`WITH`) |
|--|------|-------|--------------|
| Gemt i kataloget | ja | ja | nej (pr. query) |
| Egne vedvarende datarækker | nej* | ja | nej |
| Genbrug på tværs af queries | ja | ja | kun samme statement |

\*Et materialized view gemmer derimod et resultat, som skal opdateres med `REFRESH`. Her arbejder Raymond med almindelige views.

## Navngivning

Raymond bruger navne med `v_` for at gøre læsemodeller lette at genkende. Det er en navnekonvention, ikke et krav fra PostgreSQL. Hold også resultatets kolonnenavne tydelige, når andre skal genbruge dem.

## Performance-note

Et view **cacher ikke** automatisk. Tunge views kørt ofte → overvej indeks på basistabeller, forenkling af SQL, eller (senere) materialized view.

## Prøv selv

1. Lav `v_product_sales` med produktnavn, kategori og `SUM(quantity)`.  
2. Forespørg de 3 mest solgte.  
3. Forklar forskellen på view og CTE til en makker.

> [!RAYMOND:eureka] Forklar hvad du genbruger
>
> Vis både definitionen og en forespørgsel mod dit view. Forklar en makker, hvad der er gemt, hvad der beregnes ved læsning, og hvorfor et viewnavn ikke automatisk gør en dyr forespørgsel billig.
