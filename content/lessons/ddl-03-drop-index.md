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

**Pas på `CASCADE`:** det kan fjerne mere, end du tror. I din elev-DB er det “bare øv” — i produktion er det kritisk.

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

Unikt indeks (svarer til `UNIQUE`-constraint):

```sql
CREATE UNIQUE INDEX ux_customers_email
  ON customers (email)
  WHERE email IS NOT NULL;  -- partial index: flere NULL tilladt
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

## Tommelfingerregler

- Indeks på **FK-kolonner** (`orders.customer_id`, `orders.product_id`) — næsten altid godt
- Indeks på kolonner I ofte filtrerer på (`WHERE`, `JOIN`)
- For mange indeks = langsommere `INSERT`/`UPDATE` (hver skrivning opdaterer indeks)

## Hvilke indeks betaler sig?

| Situation | Indeks? |
|-----------|---------|
| FK-kolonne (`orders.customer_id`) | næsten altid |
| `WHERE` / `JOIN` på samme kolonne ofte | ja |
| Kolonne der næsten aldrig filtreres | nej (skriv-omkostning) |
| Lav kardinalitet alene (`boolean`) | ofte svagt alene; kombinér evt. |

### Covering / partial (kendskab)

```sql
-- Kun aktive produkter i indekset
CREATE INDEX IF NOT EXISTS ix_products_cat_active
  ON products (category)
  WHERE in_stock = TRUE;
```

Partial indexes er mindre og hurtigere, når filteret matcher.

## EXPLAIN-læsning (minimum)

| Node | Betydning |
|------|-----------|
| `Seq Scan` | læs hele tabellen |
| `Index Scan` / `Bitmap …` | brug indeks |
| `Nested Loop` / `Hash Join` | JOIN-strategi |

På små café-tabeller vælger planneren ofte seq scan — det er OK. Målet er at **kunne læse** planen, ikke at “tvinge indeks” blindly.

## Prøv selv

1. Opret `ix_orders_customer` hvis den ikke findes.
2. Kør `EXPLAIN` før/efter (efter `DROP INDEX` og opret igen).
3. Opret en midlertidig tabel, fyld den, drop den igen.
4. Sammenlign `EXPLAIN` på `WHERE customer_id = 1` med og uden indeks.
