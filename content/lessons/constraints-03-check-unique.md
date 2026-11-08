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

Raymond vil afvise negative priser og undgå to kunder med samme udfyldte e-mail. Det er forskellige krav: en betingelse om en værdi og en regel om unikhed på tværs af rækker. Nu skal du vælge og oprette den rigtige constraint til hvert krav.

> [!RAYMOND:question] Hvad tæller som en dublet?
>
> To kunder har samme udfyldte e-mail; to andre har ingen e-mail. Skal begge situationer afvises? Beskriv din hensigt, før du sammenligner den med PostgreSQLs almindelige `UNIQUE`-regel.

## UNIQUE

```sql
ALTER TABLE customers
  DROP CONSTRAINT IF EXISTS customers_email_unique;

ALTER TABLE customers
  ADD CONSTRAINT customers_email_unique UNIQUE (email);
```

Prøv at indsætte to kunder med samme e-mail — Postgres: `unique_violation`.

### NULL og UNIQUE i Postgres

Med den almindelige `UNIQUE`-regel regnes NULL-værdier som forskellige, så flere kunder kan have `email IS NULL`. Skal e-mail være både unik og påkrævet, kombinerer Raymond `NOT NULL` og `UNIQUE`. PostgreSQL har også `NULLS NOT DISTINCT`, når et design bevidst kræver en anden behandling af NULL.

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

`CHECK` er til regler om den række, der indsættes eller ændres. Brug FK til referencer og design andre mekanismer til regler på tværs af rækker eller tabeller. En `CHECK` afviser `FALSE`, men accepterer også `NULL`/UNKNOWN; krævede værdier skal derfor have `NOT NULL`.

> [!RAYMOND:skeptical] En positiv pris eller ingen pris?
>
> Hvis `price` var nullable, ville `price > 0` være ukendt ved `NULL`, ikke falsk. Derfor er `CHECK (price > 0)` og `NOT NULL` to forskellige regler. Hvilke af dem har caféens prisfelt brug for?

## Fejlkoder I skal kunne genkende

| Situation | Typisk SQLSTATE / tip |
|-----------|------------------------|
| NOT NULL brudt | `not_null_violation` |
| FK brudt | `foreign_key_violation` |
| UNIQUE brudt | `unique_violation` |
| CHECK brudt | `check_violation` |

I Npgsql kan du læse `PostgresException.SqlState`. Raymond lader API’et skelne forventede inputkonflikter fra interne fejl og returnere en passende, ufølsom fejlbesked; alle databasefejl skal ikke blindt blive til samme HTTP-svar.

## Hvad hører hvor?

| Regel | Constraint |
|-------|------------|
| Skal udfyldes | `NOT NULL` |
| Unik forretningsnøgle | `UNIQUE` / PK |
| Tal i interval / enum-lignende | `CHECK` |
| Peger på anden tabel | `FOREIGN KEY` |
| Kompleks regel på tværs af tabeller | trigger eller app |

## Deferred constraints (kendskab)

Visse `UNIQUE`, `PRIMARY KEY`, FK- og exclusion-constraints kan oprettes som **DEFERRABLE** og eventuelt kontrolleres ved `COMMIT`. PostgreSQLs `CHECK` og `NOT NULL` kan ikke udskydes sådan. Det kræver et bevidst transaktionsdesign og er ikke en genvej til at ignorere ugyldige data.

## Nulstil

Når I har eksperimenteret færdigt: **Nulstil database**, så café-seed’en er ren igen til næste lektion.

## Prøv selv

1. Tilføj `products_price_positive` og fremprovokér fejlen.  
2. Tilføj `customers_email_unique` og prøv dublet-e-mail.  
3. Diskutér: skal `quantity > 0` være CHECK på `orders` eller kun validering i API’en? (Ideelt: begge — DB som sikkerhedsnet.)

> [!RAYMOND:eureka] Din fejl skal være den forventede fejl
>
> Vælg én gyldig værdi og én ugyldig værdi til en regel. Forudsig, hvilken constraint og SQLSTATE der skal reagere. En negativ test er først overbevisende, når den fejler af den grund, du ville undersøge.
