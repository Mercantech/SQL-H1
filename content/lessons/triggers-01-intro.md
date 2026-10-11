---
title: 1. Triggers — automatik ved DML
slug: triggers-01-intro
module: triggers
order: 1
kind: theory
objectives:
  - Forklare hvad en trigger gør
  - Oprette trigger-funktion + CREATE TRIGGER
  - Skelne BEFORE/AFTER og FOR EACH ROW
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE TABLE IF NOT EXISTS product_audit (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL,
      old_price NUMERIC(10,2),
      new_price NUMERIC(10,2),
      changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION log_product_price_change()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW.price IS DISTINCT FROM OLD.price THEN
        INSERT INTO product_audit (product_id, old_price, new_price)
        VALUES (OLD.id, OLD.price, NEW.price);
      END IF;
      RETURN NEW;
    END;
    $$;
    DROP TRIGGER IF EXISTS trg_product_price ON products;
    CREATE TRIGGER trg_product_price
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION log_product_price_change();
---

# Triggers — automatik ved DML

En **trigger** kører automatisk, når der sker `INSERT`/`UPDATE`/`DELETE` på en tabel. Du bruger dem til **audit**, afledte felter eller regler, der er svære at udtrykke med constraints alene.

## To dele

1. En **trigger-funktion** (`RETURNS trigger`)
2. Et **`CREATE TRIGGER`**, der kobler funktionen til en tabel

```sql
CREATE TABLE IF NOT EXISTS product_audit (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION log_product_price_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO product_audit (product_id, old_price, new_price)
    VALUES (OLD.id, OLD.price, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_price ON products;

CREATE TRIGGER trg_product_price
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION log_product_price_change();
```

(`EXECUTE PROCEDURE` virker også som alias i mange Postgres-versioner.)

## Prøv det

```sql
UPDATE products SET price = 29.00 WHERE name = 'Espresso';

SELECT * FROM product_audit ORDER BY id DESC;
```

## BEFORE vs AFTER

| Timing | Typisk brug |
|--------|-------------|
| `BEFORE` | ret `NEW`-værdier, afvis med `RAISE`, sæt defaults |
| `AFTER` | audit-log, opdatér andre tabeller |

## FOR EACH ROW vs STATEMENT

- **ROW** (det I bruger her): kører pr. berørt række — har `NEW`/`OLD`
- **STATEMENT**: kører én gang pr. SQL-sætning

## DROP

```sql
DROP TRIGGER IF EXISTS trg_product_price ON products;
DROP FUNCTION IF EXISTS log_product_price_change();
```

## NEW og OLD

| Event | `OLD` | `NEW` |
|-------|-------|-------|
| INSERT | — | den nye række |
| UPDATE | før | efter |
| DELETE | den slettede | — |

`IS DISTINCT FROM` er NULL-sikkert — brug det til “ændrede pris?”.

## Statement-level (kendskab)

`FOR EACH STATEMENT` kører én gang pr. SQL — har ikke række-`NEW`/`OLD` på samme måde. Til audit pr. række: **ROW**.

## Transition tables (kendskab)

Nyere Postgres kan give `REFERENCING NEW TABLE AS …` til statement-triggers — nyttigt til bulk, men uden for H1-kerne.

## Prøv selv

1. Opret audit-tabellen + triggeren.  
2. Opdatér Espresso-prisen to gange — se flere loglinjer.  
3. Opdatér kun `name` — forvent **ingen** ny audit, hvis I kun logger pris.
