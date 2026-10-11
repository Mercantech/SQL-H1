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

**Foretræk CHECK**, når reglen er simpel. Brug trigger, når du skal kigge i andre tabeller, skrive audit, eller beregne felter.

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
