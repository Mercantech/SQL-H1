---
title: 5. Datatyper, IDENTITY og defaults
slug: ddl-05-types
module: ddl-er
order: 5
kind: theory
objectives:
  - Vælge mellem TEXT, VARCHAR, NUMERIC, INT, BOOLEAN, timestamptz
  - Skelne SERIAL og GENERATED AS IDENTITY
  - Bruge DEFAULT bevidst
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    INSERT INTO promo_codes (code, discount_pct)
    VALUES ('CAFE10', 10.00)
    RETURNING *;
---

# Datatyper, IDENTITY og defaults

## Hyppige typer i H1

| Type | Brug |
|------|------|
| `INT` / `BIGINT` | tællere, FK, id |
| `NUMERIC(p,s)` | penge (undgå `float` til beløb) |
| `TEXT` | ubegrænset tekst (Postgres-favorit) |
| `VARCHAR(n)` | når I *vil* have max-længde |
| `BOOLEAN` | sand/falsk |
| `DATE` | kun dato |
| `TIMESTAMPTZ` | tidspunkt med tidzone (anbefalet til “skete hvornår”) |

## SERIAL vs IDENTITY

```sql
-- Klassisk (stadig udbredt)
id SERIAL PRIMARY KEY

-- Moderne SQL-standard
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

Begge giver auto-increment. `IDENTITY` er tydeligere ift. “databasen ejer værdien”.

## DEFAULT

```sql
CREATE TABLE IF NOT EXISTS promo_codes (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO promo_codes (code) VALUES ('WELCOME');
-- discount_pct, active, created_at sættes automatisk
```

## Penge — undgå fælden

```sql
-- Dårligt til beløb
price REAL

-- Bedre
price NUMERIC(10,2) NOT NULL
```

## Øvelse

Opret `promo_codes`, indsæt 2 koder, og kør:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'promo_codes'
ORDER BY ordinal_position;
```
