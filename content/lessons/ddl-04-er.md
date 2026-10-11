---
title: 4. E/R — dokumentér dit skema
slug: ddl-04-er
module: ddl-er
order: 4
kind: theory
objectives:
  - Dokumentere entiteter og relationer
  - Koble E/R til CREATE TABLE / FK
  - Bruge Database-siden som levende diagram
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    SELECT
      tc.table_name AS barn,
      kcu.column_name AS fk_kolonne,
      ccu.table_name AS foraelder
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
---

# E/R — dokumentér dit skema

**E/R** (*Entity-Relationship*) er tegningen af din database: **hvad** findes, og **hvordan** hænger det sammen. SQL er implementeringen; E/R er kortet I designer efter (eller dokumenterer med).

## Caféen som E/R

```text
customers (1) ──< (n) orders (n) >── (1) products
```

| Entitet | Tabel | Nøgle |
|---------|-------|-------|
| Kunde | `customers` | `id` PK |
| Produkt | `products` | `id` PK |
| Ordre | `orders` | `id` PK, FK til begge |

Kardinalitet: én kunde har mange ordrer; én ordre pejer på ét produkt (MVP). Walk-in: `orders.customer_id` må være `NULL`.

## Fra E/R til DDL

1. Tegn entiteter (kasser)
2. Find 1:n / n:n (streger)
3. n:n → koblingstabel
4. Skriv `CREATE TABLE` med PK
5. Tilføj `REFERENCES` (FK)
6. Tilføj `UNIQUE` / `CHECK` hvor forretningen kræver det

Det er samme historie som i *Relationstyper og database-design* — nu ejer du knapperne (`CREATE`/`ALTER`).

## Levende dokumentation i SQL-H1

Gå til **Database** i menuen: der ser du tabeller, kolonner og relationer fra **din** database (inkl. tabeller du selv opretter).

Metadata med SQL:

```sql
SELECT
  tc.table_name AS barn,
  kcu.column_name AS fk_kolonne,
  ccu.table_name AS foraelder
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY barn, fk_kolonne;
```

## Mini-designøvelse (café-udvidelse)

Tegn (på papir eller i tekst) og implementér gerne:

```text
suppliers (1) ──< (n) products
categories (1) ──< (n) products   -- lookup i stedet for fri tekst
```

Krav:
- `suppliers(id, name, city)`
- `categories(id, name)` med `UNIQUE(name)`
- `products` får `supplier_id` og/eller `category_id` (FK)

Når det virker: tjek **Database**-diagrammet og metadata-forespørgslen ovenfor.

## Hvorfor det betyder noget i projektet

I H1-projektet skal I kunne:
- forklare skemaet til hinanden og underviseren
- ændre struktur uden at “gætte” i blinde
- pege på hvor applikationen (C#/API) mapper til tabeller
