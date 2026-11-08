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

Raymond vil kunne svare på to forskellige spørgsmål: Hvornår blev produktet sidst opdateret, og hvem ændrede prisen? Det kræver tydelige felter og et dokumenteret revisionsspor, ikke bare flere skjulte handlinger.

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

Raymond ændrer `NEW.updated_at` før rækken gemmes. Den viste trigger reagerer på enhver UPDATE af rækken, også `SET price = price`. Feltet fortæller derfor, at en opdatering blev udført, ikke nødvendigvis at en forretningsværdi blev anderledes.

> [!RAYMOND:question] Opdateret er ikke altid ændret
>
> Forudsig, hvad der sker med `updated_at`, når prisen sættes til sin nuværende værdi. Sammenlign med pris-audit-triggeren fra første lektion: hvilken betingelse gør deres resultater forskellige?

## Hvad I *ikke* skal trigge på

- Forretningsmails, HTTP-kald, Auth — hører hjemme i **C#**
- Regler der kan være `CHECK`/`UNIQUE`/`FK`
- Kompleks orkestrering på tværs af mange aggregater (bliver uoverskueligt)

## Checkliste før I tilføjer en trigger

1. Kan det være en constraint?  
2. Kan appen sætte værdien eksplicit?  
3. Er side effects dokumenteret?  
4. Har I en plan for bulk-load (disable trigger midlertidigt)?

## created_at / updated_at sammen

```sql
-- created_at: DEFAULT now() på kolonnen er ofte nok
-- updated_at: BEFORE UPDATE trigger (som her)
```

Undgå at sætte `created_at` i en UPDATE-trigger — den skal være immutable.

## Audit: hvem ændrede hvad?

Raymond skelner mellem databaserollen og personen i appen. `current_user` kan vise elevrollen eller en fælles appkonto. En applikationsidentitet kan tilføjes via en kontrolleret kolonne eller en lokalt sat sessionsindstilling som `current_setting('app.user', true)`. Den er kun troværdig, hvis den validerede backend styrer værdien; et frit klientinput er ikke et bevis på brugerens identitet.

## Disable til import

```sql
ALTER TABLE products DISABLE TRIGGER trg_products_touch;
-- bulk load …
ALTER TABLE products ENABLE TRIGGER trg_products_touch;
```

Kun når I forstår konsekvensen.

## Prøv selv

1. Tilføj `updated_at` + trigger.  
2. Opdatér Te og læs `updated_at`.  
3. Opdatér uden at ændre værdier (`SET price = price`) — se at trigger stadig kører (BEFORE UPDATE kører alligevel).

> [!RAYMOND:reading] Gør det skjulte synligt
>
> Beskriv triggerens hændelse, tidspunkt og ændrede felter til en makker. Kan makkeren forudsige effekten af en UPDATE uden at læse appens kode? Dokumentér også, hvordan I kontrollerer data efter en eventuel importpause.
