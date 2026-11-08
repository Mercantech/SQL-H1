---
title: 1. Funktioner i Postgres
slug: procedures-01-functions
module: procedures
order: 1
kind: theory
objectives:
  - Oprette SQL- og plpgsql-funktioner
  - Skelne RETURNS TABLE / skalar
  - Kalde funktioner fra SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE FUNCTION order_line_total(p_order_id INT)
    RETURNS NUMERIC
    LANGUAGE sql
    STABLE
    AS $$
      SELECT o.quantity * p.price
      FROM orders o
      JOIN products p ON p.id = o.product_id
      WHERE o.id = p_order_id;
    $$;
    SELECT id, order_line_total(id) AS total FROM orders ORDER BY id LIMIT 5;
---

# Funktioner i Postgres

Raymond ser den samme beregning af ordrebeløb tre steder i caféens kode. Han vil samle den ét sted, men først skal du kunne forklare dens input, resultat og afhængighed af tabellerne.

En **funktion** giver genbrugelig logik et navn. Raymond begynder med en almindelig SELECT, som du kan kontrollere, og giver derefter beregningen en parameter og en returtype.

## Skalar funktion (SQL-sprog)

```sql
CREATE OR REPLACE FUNCTION order_line_total(p_order_id INT)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT o.quantity * p.price
  FROM orders o
  JOIN products p ON p.id = o.product_id
  WHERE o.id = p_order_id;
$$;

SELECT id, order_line_total(id) AS total
FROM orders
ORDER BY id
LIMIT 5;
```

`$$…$$` er **dollar-quoting**: kroppen er en samlet streng, hvor de indre semikoloner ikke afslutter den ydre CREATE-sætning.

> [!RAYMOND:question] Ét ordre-id ind — hvad kommer ud?
>
> Kald `order_line_total` med et eksisterende ordre-id og derefter et id, der ikke findes. Forudsig først resultatet. Hvilken forskel gør det, at funktionen læser tabeller frem for kun at regne på sine argumenter?

## RETURNS TABLE

```sql
CREATE OR REPLACE FUNCTION top_products(p_limit INT)
RETURNS TABLE(produkt TEXT, antal BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT p.name, SUM(o.quantity)::bigint
  FROM orders o
  JOIN products p ON p.id = o.product_id
  GROUP BY p.name
  ORDER BY SUM(o.quantity) DESC
  LIMIT p_limit;
$$;

SELECT * FROM top_products(3);
```

## plpgsql — når du skal bruge IF

```sql
CREATE OR REPLACE FUNCTION city_tier(p_city TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_city IN ('Aarhus', 'Aalborg') THEN
    RETURN 'Storby';
  ELSIF p_city = 'Viborg' THEN
    RETURN 'Lokal';
  ELSE
    RETURN 'Anden';
  END IF;
END;
$$;

SELECT name, city, city_tier(city) FROM customers;
```

## DROP

```sql
DROP FUNCTION IF EXISTS order_line_total(INT);
DROP FUNCTION IF EXISTS top_products(INT);
```

I Postgres kan flere funktioner dele navn med forskellige argumenttyper — derfor angiver man ofte signaturen ved `DROP`.

## LANGUAGE sql vs plpgsql

| | `LANGUAGE sql` | `LANGUAGE plpgsql` |
|--|----------------|---------------------|
| Krop | SQL-sætninger; den sidste leverer normalt resultatet | blokke, `IF`, loops |
| Enkelhed | bedst til rene beregninger | bedst til logik |
| Plan | nogle enkle funktioner kan inlines | procedurel udførelse; SQL indeni planlægges også |

Raymond vælger `LANGUAGE sql`, når SQL beskriver arbejdet klart. Når valideringen kræver grene, giver `plpgsql` mulighed for IF. Sproget vælges efter opgaven.

## Parametre: IN (og OUT — kendskab)

```sql
CREATE OR REPLACE FUNCTION add_vat(amount NUMERIC, vat NUMERIC DEFAULT 0.25)
RETURNS NUMERIC
LANGUAGE sql IMMUTABLE
AS $$
  SELECT round(amount * (1 + vat), 2);
$$;

SELECT name, price, add_vat(price) AS med_moms FROM products LIMIT 5;
```

## Skalar funktion eller tabelresultat?

- **Skalar:** én værdi pr. kald (`order_line_total`)  
- **Set-returning / `RETURNS TABLE`:** bruges i `FROM` (`top_products(3)`)

## Prøv selv

1. Opret `order_line_total` og `top_products`.  
2. Skriv en `IMMUTABLE` hjælpefunktion (`add_vat`).  
3. `DROP` med fuld signatur.

> [!RAYMOND:thinking] Forklar funktionen uden at læse op
>
> Beskriv input og returværdi for `order_line_total` og `top_products`. Hvorfor kaldes den ene i SELECT-listen og den anden i FROM? Peg på den del af definitionen, der understøtter dit svar.
