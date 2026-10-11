---
title: 3. Fejlhåndtering og SECURITY
slug: procedures-03-errors
module: procedures
order: 3
kind: theory
objectives:
  - Bruge RAISE i plpgsql
  - Kende SECURITY INVOKER vs DEFINER (kort)
  - Validere input i funktioner
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE FUNCTION require_positive(p_n INT)
    RETURNS INT
    LANGUAGE plpgsql
    AS $$
    BEGIN
      IF p_n IS NULL OR p_n <= 0 THEN
        RAISE EXCEPTION 'Forventede n > 0, fik %', p_n;
      END IF;
      RETURN p_n;
    END;
    $$;
    SELECT require_positive(3);
---

# Fejlhåndtering og SECURITY

## RAISE EXCEPTION

```sql
CREATE OR REPLACE FUNCTION require_positive(p_n INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_n IS NULL OR p_n <= 0 THEN
    RAISE EXCEPTION 'Forventede n > 0, fik %', p_n;
  END IF;
  RETURN p_n;
END;
$$;

SELECT require_positive(3);   -- OK
-- SELECT require_positive(0); -- fejler bevidst
```

Brug det i funktioner der kaldes fra triggers eller API-nære flows, når constraints ikke er nok.

## SECURITY INVOKER vs DEFINER

| | INVOKER (default i moderne PG) | DEFINER |
|--|-------------------------------|---------|
| Rettigheder | kører med **kalderens** rettigheder | kører med **ejerens** rettigheder |
| Risiko | sikrere default | kan utilsigtet eskalere rettigheder |

Til H1: husk at **DEFINER** er kraftfuldt og skal bruges bevidst (sjældent i elevopgaver).

## Volatilitet (kort)

| Markør | Betydning |
|--------|-----------|
| `IMMUTABLE` | samme input → samme output altid |
| `STABLE` | konstant inden for én statement (typisk `SELECT` på tabeller) |
| `VOLATILE` | kan ændre sig / have side effects (default) |

Forkert markør kan give forkerte planer — start med default, og sæt `STABLE`/`IMMUTABLE` når I er sikre.
