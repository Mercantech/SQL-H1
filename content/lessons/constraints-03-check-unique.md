---
title: 3. UNIQUE, CHECK og fejltyper
slug: constraints-03-check-unique
module: constraints
order: 3
kind: theory
objectives:
  - Skelne UNIQUE, CHECK og PK
  - Fremprovokere og læse Postgres-fejl
  - Vælge den rigtige constraint til reglen
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    ALTER TABLE products
      DROP CONSTRAINT IF EXISTS products_price_positive;
    ALTER TABLE products
      ADD CONSTRAINT products_price_positive CHECK (price > 0);
    UPDATE products SET price = -5 WHERE name = 'Te';
---

# UNIQUE, CHECK og fejltyper

I har mærket `NOT NULL` og FK. Nu udvider I værktøjskassen — og **skriver** constraints med DDL i jeres egen DB.

## UNIQUE

```sql
-- Én e-mail pr. kunde (flere NULL er OK i Postgres UNIQUE)
ALTER TABLE customers
  ADD CONSTRAINT customers_email_unique UNIQUE (email);
```

Prøv at indsætte to kunder med samme e-mail — Postgres svarer med `unique_violation`.

## CHECK

```sql
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_price_positive;

ALTER TABLE products
  ADD CONSTRAINT products_price_positive CHECK (price > 0);

-- Skal fejle:
UPDATE products SET price = -5 WHERE name = 'Te';
```

## Fejlkoder I skal kunne genkende

| Situation | Typisk SQLSTATE / tip |
|-----------|------------------------|
| NOT NULL brudt | `not_null_violation` |
| FK brudt | `foreign_key_violation` |
| UNIQUE brudt | `unique_violation` |
| CHECK brudt | `check_violation` |

Læs fejlteksten — den nævner ofte constraint-navnet (`products_price_positive`). **Navngiv constraints**, så fejlsøgning er nem.

## Hvad hører hvor?

| Regel | Constraint |
|-------|------------|
| Skal udfyldes | `NOT NULL` |
| Unik forretningsnøgle | `UNIQUE` / PK |
| Tal i interval | `CHECK` |
| Peger på anden tabel | `FOREIGN KEY` |
| Kompleks regel på tværs af tabeller | trigger eller app |

## Nulstil

Når I har eksperimenteret færdigt: **Nulstil database**, så café-seed’en er ren igen til næste lektion.
