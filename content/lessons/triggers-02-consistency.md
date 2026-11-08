---
title: 2. Triggers til konsistens
slug: triggers-02-consistency
module: triggers
order: 2
kind: theory
objectives:
  - Bruge BEFORE-trigger til validering
  - Kende begrænsninger ved triggers
  - Vælge constraint vs trigger vs app-logik
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE FUNCTION enforce_positive_quantity()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
        RAISE EXCEPTION 'quantity skal være > 0 (fik %)', NEW.quantity;
      END IF;
      RETURN NEW;
    END;
    $$;
    DROP TRIGGER IF EXISTS trg_orders_qty ON orders;
    CREATE TRIGGER trg_orders_qty
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION enforce_positive_quantity();
---

# Triggers til konsistens

Raymond bliver foreslået en trigger, hver gang en ny regel dukker op. Han stopper op: Vi skal først finde den mindste mekanisme, der kan beskytte reglen. Her sammenligner I validering, constraints og automatiske handlinger.

Constraints (`CHECK`, `FK`, `UNIQUE`) bør være **første valg**. Triggers er til regler, der er mere dynamiske — eller til side effects (log, cache-tabeller).

## BEFORE INSERT/UPDATE — afvis ugyldigt

```sql
CREATE OR REPLACE FUNCTION enforce_positive_quantity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'quantity skal være > 0 (fik %)', NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_qty ON orders;

CREATE TRIGGER trg_orders_qty
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION enforce_positive_quantity();
```

Prøv (skal fejle):

```sql
INSERT INTO orders (customer_id, product_id, quantity, order_date)
VALUES (1, 1, 0, CURRENT_DATE);
```

Bemærk: det samme kunne ofte løses med:

```sql
ALTER TABLE orders ADD CONSTRAINT orders_qty_positive CHECK (quantity > 0);
```

**Foretræk CHECK sammen med eventuel NOT NULL**, når reglen kan udtrykkes på rækken. Caféens `quantity` er allerede NOT NULL; en CHECK alene ville ellers acceptere et ukendt resultat ved NULL. Til referencekrav vælger Raymond en FK. Audit og visse mere komplekse regler kan kræve en trigger.

> [!RAYMOND:thinking] To forsvar — er de virkelig ens?
>
> Triggeren afviser både NULL og et antal under én. Hvilken del af beskyttelsen kommer fra CHECK, og hvilken kommer fra NOT NULL, hvis du vælger constraints? Brug konkrete ugyldige input til at underbygge svaret.

## Typisk café-regel (idé)

“Når et produkt sættes `in_stock = FALSE`, sæt en note i en log-tabel.”  
Det er side effect → trigger (eller app-kode). Ikke en `CHECK`.

## Faldgruber

| Problem | Hvorfor |
|---------|---------|
| Skjulte side effects | Appen forstår ikke, hvorfor rækker dukker op i audit |
| Performance | Trigger pr. række på store bulk-loads |
| Rekursion | Trigger A opdaterer B, der trigger A igen |
| Svær test | Logik spredt mellem C# og Postgres |

## Beslutningsguide

```text
Kan det være NOT NULL / UNIQUE / CHECK / FK?
  → ja: brug constraint
Skal noget ske automatisk ved DML (log, afledt felt)?
  → trigger (eller app-event)
Er det forretningsflow (e-mail, betaling, Auth)?
  → C# API
```

## RAISE i BEFORE-trigger

```sql
IF NEW.quantity <= 0 THEN
  RAISE EXCEPTION 'quantity skal være > 0 (fik %)', NEW.quantity;
END IF;
RETURN NEW;  -- vigtigt: BEFORE skal returnere NEW (eller NULL for at springe række over)
```

Returnér `NULL` i BEFORE ROW for at **stille** springe rækken over (sjældent ønsket — vær eksplicit med EXCEPTION i stedet).

## Idempotens og bulk

En FOR EACH ROW-trigger kaldes pr. berørt række: 1.000 rækker giver 1.000 kald. Raymond undersøger derfor dens arbejde ved store imports. En eventuel deaktivering kræver de rette rettigheder, en kendt vedligeholdelsesprocedure og efterfølgende kontrol; den må ikke bruges som genvej uden om integritetskrav. Et batch-flow i C# kan være et alternativ, når alle skriveveje stadig beskytter de nødvendige regler.

## Prøv selv

1. Opret `trg_orders_qty` og prøv `quantity = 0`.  
2. Tilføj `CHECK (quantity > 0)` i stedet — sammenlign fejloplevelsen.  
3. Skriv i README: “Triggers bruges til X; constraints til Y; API til Z.”

> [!RAYMOND:idea-notes] Vælg og begrund
>
> Fordel tre krav: positivt antal, reference til en eksisterende kunde og log over prisændringer. Vælg den enkleste egnede mekanisme til hvert krav, og forklar, hvad der kan gå galt, hvis en klient omgår appens validering.
