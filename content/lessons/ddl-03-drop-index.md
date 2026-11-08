---
title: 3. DROP, indeks og performance-hint
slug: ddl-03-drop-index
module: ddl-er
order: 3
kind: theory
objectives:
  - Slette objekter sikkert med DROP
  - Oprette indeks med CREATE INDEX
  - Læse et simpelt EXPLAIN
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE INDEX IF NOT EXISTS ix_orders_customer ON orders (customer_id);
    EXPLAIN SELECT * FROM orders WHERE customer_id = 1;
---

# DROP, indeks og performance-hint

Raymond har en tom hjælpetabel, der kan fjernes, og en voksende ordreliste, der skal undersøges. Det er to forskellige opgaver: **DROP fjerner struktur**, mens et **indeks** kan ændre, hvordan databasen finder rækker. Ingen af delene bør vælges på gæt.

> [!RAYMOND:warning] Hvad følger med ud?
>
> Hvis en anden tabel har en FK til `suppliers`, kan `DROP TABLE ... CASCADE` fjerne den afhængige constraint. Det betyder ikke, at hele den anden tabel også slettes. Undersøg afhængighederne, før du accepterer konsekvensen.

## DROP — fjern struktur

```sql
DROP TABLE IF EXISTS suppliers CASCADE;
```

| Variant | Effekt |
|---------|--------|
| `DROP TABLE t` | Fejler hvis `t` mangler |
| `DROP TABLE IF EXISTS t` | OK hvis den mangler |
| `... CASCADE` | Fjerner også afhængige objekter (FX FK, views) |
| `... RESTRICT` | Fejler hvis noget afhænger af tabellen (default i Postgres for mange tilfælde) |

**Undersøg `CASCADE`:** skriv ned, hvilke afhængige objekter der må forsvinde. Elevdatabasen er et sted at øve sig, men dine egne ændringer og indtastede data kan stadig gå tabt.

Du kan også:

```sql
DROP INDEX IF EXISTS ix_orders_customer;
DROP VIEW IF EXISTS v_order_summary;
```

## Indeks — genvej til rækker

Uden indeks scanner Postgres ofte hele tabellen (`Seq Scan`). Med indeks kan den hoppe direkte (`Index Scan` / `Bitmap`).

```sql
CREATE INDEX ix_orders_customer ON orders (customer_id);
CREATE INDEX ix_products_category ON products (category);
```

Et unikt indeks håndhæver unikhed for de rækker, det omfatter. Her er det desuden **partielt**, fordi det kun medtager udfyldte e-mails:

```sql
CREATE UNIQUE INDEX ux_customers_email
  ON customers (email)
  WHERE email IS NOT NULL;  -- partial index: kun udfyldte e-mails
```

## EXPLAIN — se planen

```sql
EXPLAIN
SELECT * FROM orders WHERE customer_id = 1;
```

```sql
EXPLAIN ANALYZE
SELECT c.name, COUNT(*) 
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.name;
```

`EXPLAIN` viser planen. `EXPLAIN ANALYZE` **kører** forespørgslen og viser faktiske tider — brugbart, men dyrere.

> [!RAYMOND:performance] Hurtigere for hvilken forespørgsel?
>
> Et indeks koster plads og arbejde ved skrivning. Før du opretter det, så peg på det opslag eller den FK-kontrol, du vil hjælpe. Sammenlign planen med samme data og samme forespørgsel bagefter.

## Tommelfingerregler

- Overvej indeks på **FK-kolonner**, når opslag eller ændringer på den refererede tabel ellers skal undersøge mange barn-rækker
- Vurdér ofte brugte `WHERE`- og `JOIN`-kolonner sammen med datamængde og hvor stor en del af tabellen forespørgslen henter
- For mange indeks = langsommere `INSERT`/`UPDATE` (hver skrivning opdaterer indeks)

## Hvilke indeks betaler sig?

| Situation | Indeks? |
|-----------|---------|
| FK-kolonne (`orders.customer_id`) | undersøg opslag og referentiel kontrol på realistiske data |
| `WHERE` / `JOIN` på samme kolonne ofte | en kandidat, som skal vurderes med planen |
| Kolonne der næsten aldrig filtreres | nej (skriv-omkostning) |
| Lav kardinalitet alene (`boolean`) | ofte svagt alene; kombinér evt. |

### Covering / partial (kendskab)

```sql
-- Kun aktive produkter i indekset
CREATE INDEX IF NOT EXISTS ix_products_cat_active
  ON products (category)
  WHERE in_stock = TRUE;
```

Et partielt indeks omfatter færre rækker, men hjælper kun relevante forespørgsler, hvor planneren kan bruge betingelsen. Raymond vil se planen og målingen, før han kalder løsningen hurtigere.

## EXPLAIN-læsning (minimum)

| Node | Betydning |
|------|-----------|
| `Seq Scan` | læs hele tabellen |
| `Index Scan` / `Bitmap …` | brug indeks |
| `Nested Loop` / `Hash Join` | JOIN-strategi |

På små café-tabeller vælger planneren ofte seq scan — det er OK. Målet er at **kunne læse** planen og begrunde valget ud fra målinger.

## Prøv selv

1. Opret `ix_orders_customer` hvis den ikke findes.
2. Kør `EXPLAIN` før/efter (efter `DROP INDEX` og opret igen).
3. Opret en midlertidig tabel, fyld den, drop den igen.
4. Sammenlign `EXPLAIN` på `WHERE customer_id = 1` med og uden indeks.

> [!RAYMOND:skeptical] Seq Scan er ikke automatisk en fejl
>
> På caféens lille tabel kan en sekventiel læsning være billigst. Forklar, hvorfor dit indeks godt kan være oprettet korrekt uden at blive brugt. Hvilken større datamængde eller anden forespørgsel ville være relevant at undersøge?
