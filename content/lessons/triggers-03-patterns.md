---
title: 3. Audit- og timestamp-mønstre
slug: triggers-03-patterns
module: triggers
order: 3
kind: theory
objectives:
  - Sætte updated_at automatisk
  - Logge INSERT/DELETE kort
  - Undgå trigger-spaghetti
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
    CREATE OR REPLACE FUNCTION touch_updated_at()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.updated_at := now();
      RETURN NEW;
    END;
    $$;
    DROP TRIGGER IF EXISTS trg_products_touch ON products;
    CREATE TRIGGER trg_products_touch
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION touch_updated_at();
    UPDATE products SET price = price WHERE name = 'Te';
    SELECT name, updated_at FROM products WHERE name = 'Te';
---

# Audit- og timestamp-mønstre

## updated_at automatisk

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_touch ON products;

CREATE TRIGGER trg_products_touch
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION touch_updated_at();
```

`BEFORE` + ændring af `NEW` er det klassiske mønster.

## Hvad I *ikke* skal trigge på

- Forretningsmails, HTTP-kald, Auth — hører hjemme i **C#**
- Regler der kan være `CHECK`/`UNIQUE`/`FK`
- Kompleks orkestrering på tværs af mange aggregater (bliver uoverskueligt)

## Checkliste før I tilføjer en trigger

1. Kan det være en constraint?  
2. Kan appen sætte værdien eksplicit?  
3. Er side effects dokumenteret?  
4. Har I en plan for bulk-load (disable trigger midlertidigt)?
