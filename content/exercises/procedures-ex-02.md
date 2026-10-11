---
title: Opgave B — Validerende funktion
slug: procedures-ex-02
module: procedures
order: 11
kind: exercise
objectives:
  - plpgsql med RAISE
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/procedures-ex-02/checks.json
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
---

# Opgave B — Validerende funktion

## Krav

Opret funktionen **`require_positive(p_n INT)`**, der:

- returnerer `p_n`, hvis `p_n > 0`
- kaster fejl med `RAISE EXCEPTION`, hvis `p_n` er `NULL` eller `<= 0`
