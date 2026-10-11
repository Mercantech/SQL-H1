---
title: 2. Views til sikkerhed og forenkling
slug: views-02-security
module: views
order: 2
kind: theory
objectives:
  - Begrunde views ift. “need to know”
  - Skjule kolonner og filtrere rækker
  - Kende forskel på view og kopi af data
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE VIEW v_public_products AS
    SELECT id, name, category, price
    FROM products
    WHERE in_stock = TRUE;
    SELECT * FROM v_public_products ORDER BY name;
---

# Views til sikkerhed og forenkling

I en rigtig app må kassen **ikke** se kundernes e-mails, og en rapportbruger behøver ikke `in_stock`-flaget. Views er et klassisk lag mellem **rå tabeller** og **hvem der må se hvad**.

## Skjul kolonner

```sql
CREATE OR REPLACE VIEW v_public_products AS
SELECT id, name, category, price
FROM products
WHERE in_stock = TRUE;

SELECT * FROM v_public_products ORDER BY name;
```

Appen (eller en rolle) får kun `SELECT` på view’et — ikke på `products` direkte. Så kan I senere `GRANT`/`REVOKE` (næste modul).

## Filtrér rækker (“row filter”)

```sql
CREATE OR REPLACE VIEW v_viborg_customers AS
SELECT id, name, city
FROM customers
WHERE city = 'Viborg';
```

## View ≠ kopi

| | View | Tabel / materialiseret data |
|--|------|------------------------------|
| Lagring | Kun definitionen (`SELECT`) | Rækker på disk |
| Opdatering | Ser altid nyeste data | Skal synkroniseres |
| Performance | Kører underliggende SQL hver gang | Kan være hurtigere (trade-off) |

Postgres har også **materialized views** (`CREATE MATERIALIZED VIEW` + `REFRESH`) — nyttigt til tunge rapporter. Til H1 er almindelige views nok.

## Café-scenarie

Forestil dig tre “brugere” af data:

1. **Barista-app** — `v_public_products` (navn, pris, kategori)
2. **Bogholder** — view med ordrer + beløb (`quantity * price`)
3. **Marketing** — kunder i Viborg uden e-mail-kolonne

Implementér mindst ét af dem, og forklar *hvorfor* det er bedre end `SELECT * FROM customers`.

## Tjek definitionen

```sql
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public';
```
