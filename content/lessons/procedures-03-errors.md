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

Raymond vil genbruge en funktion, som kun må modtage positive heltal. En tom værdi er også ugyldig. Nu undersøger I, hvordan funktionen siger fra, og hvilke rettigheder den arbejder med.

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

> [!RAYMOND:skeptical] Tre input — tre beviser
>
> Forudsig udfaldet for `3`, `0` og `NULL`. Et positivt tal alene viser ikke, at valideringen virker. Kontrollér både den returnerede værdi og de fejl, der skal afvise de øvrige input.

## SECURITY INVOKER vs DEFINER

| | INVOKER (standard) | DEFINER |
|--|-------------------------------|---------|
| Rettigheder | kører med **kalderens** rettigheder | kører med **ejerens** rettigheder |
| Risiko | sikrere default | kan utilsigtet eskalere rettigheder |

Til H1: husk at **DEFINER** er kraftfuldt og skal bruges bevidst (sjældent i elevopgaver).

## Volatilitet (kort)

| Markør | Betydning |
|--------|-----------|
| `IMMUTABLE` | samme input → samme output altid |
| `STABLE` | samme argumenter giver samme resultat inden for én SQL-sætning; må ikke ændre databasen |
| `VOLATILE` | kan ændre sig / have side effects (default) |

Raymond behandler markøren som et løfte til planlæggeren. STABLE betyder ikke, at alle ordre-id’er får samme beløb: løftet gælder gentagne kald med **samme argumenter** i én sætning. IMMUTABLE kræver desuden, at resultatet ikke afhænger af skiftende tabeldata eller indstillinger.

## RAISE-niveauer

```sql
RAISE NOTICE 'debug: %', p_n;      -- log / klient-notice
RAISE WARNING '…';
RAISE EXCEPTION '…';              -- aborterer statement/transaktion
```

Til validering: brug **EXCEPTION**. NOTICE er til debug.

## EXCEPTION-blok (kendskab)

```sql
BEGIN
  -- …
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'e-mail findes allerede';
END;
```

Fang specifikke SQLSTATE-navne i stedet for blind `WHEN OTHERS`.

## Prøv selv

1. Opret `require_positive` og kald med `3` og `0`.  
2. Læs fejlbeskeden ved `0`.  
3. Diskutér: skal denne regel være CHECK i stedet? (Ja, hvis den er simpel — funktioner til det mere dynamiske.)

> [!RAYMOND:safe-lock] Hvilket løfte giver du databasen?
>
> Forklar forskellen mellem inputvalidering, INVOKER/DEFINER og volatilitet. De besvarer tre spørgsmål: Er input gyldigt, hvis rettigheder bruges, og hvornår kan resultatet ændre sig?

Kilde: [PostgreSQL om funktionsvolatilitet](https://www.postgresql.org/docs/16/xfunc-volatility.html).
