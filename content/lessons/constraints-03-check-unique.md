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
ALTER TABLE customers
  DROP CONSTRAINT IF EXISTS customers_email_unique;

ALTER TABLE customers
  ADD CONSTRAINT customers_email_unique UNIQUE (email);
```

Prøv at indsætte to kunder med samme e-mail — Postgres: `unique_violation`.

### NULL og UNIQUE i Postgres

Flere rækker må have `email IS NULL` under en `UNIQUE`-constraint. `NULL` betyder “ukendt” og kolliderer ikke med andre `NULL`. Skal e-mail være både unik *og* påkrævet: kombiner `NOT NULL` + `UNIQUE`.

### Sammensat UNIQUE

```sql
-- Eksempel-mønster (ikke i seed): ét varenr. pr. leverandør
-- UNIQUE (supplier_id, sku)
```

Bruges når unikhed er **kombinationen**, ikke enkeltkolonnen.

## CHECK

```sql
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_price_positive;

ALTER TABLE products
  ADD CONSTRAINT products_price_positive CHECK (price > 0);

-- Skal fejle:
UPDATE products SET price = -5 WHERE name = 'Te';
```

Flere eksempler på nyttige checks:

```sql
-- Antal positivt
-- CHECK (quantity > 0)

-- Status i tilladt mængde
-- CHECK (status IN ('draft', 'paid', 'cancelled'))

-- Interval
-- CHECK (discount_pct >= 0 AND discount_pct <= 100)
```

`CHECK` kan ikke (praktisk) kigge i *andre* tabeller — så brug FK til relationer, og triggers/app til tværgående forretningsregler.

## Fejlkoder I skal kunne genkende

| Situation | Typisk SQLSTATE / tip |
|-----------|------------------------|
| NOT NULL brudt | `not_null_violation` |
| FK brudt | `foreign_key_violation` |
| UNIQUE brudt | `unique_violation` |
| CHECK brudt | `check_violation` |

I Npgsql/C# lander det ofte som `PostgresException` med `SqlState` — map til 400-svar i API’en.

## Hvad hører hvor?

| Regel | Constraint |
|-------|------------|
| Skal udfyldes | `NOT NULL` |
| Unik forretningsnøgle | `UNIQUE` / PK |
| Tal i interval / enum-lignende | `CHECK` |
| Peger på anden tabel | `FOREIGN KEY` |
| Kompleks regel på tværs af tabeller | trigger eller app |

## Deferred constraints (kendskab)

I avancerede migrationer kan constraints sættes til at tjekkes ved **COMMIT** i stedet for pr. statement (`DEFERRABLE`). Sjældent nødvendigt i H1 — men forklarer, hvorfor nogle ETL-jobs midlertidigt kan bryde rækkefølgen inde i en transaktion.

## Nulstil

Når I har eksperimenteret færdigt: **Nulstil database**, så café-seed’en er ren igen til næste lektion.

## Prøv selv

1. Tilføj `products_price_positive` og fremprovokér fejlen.  
2. Tilføj `customers_email_unique` og prøv dublet-e-mail.  
3. Diskutér: skal `quantity > 0` være CHECK på `orders` eller kun validering i API’en? (Ideelt: begge — DB som sikkerhedsnet.)
