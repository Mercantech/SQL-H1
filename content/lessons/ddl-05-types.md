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

Raymond vil give caféen rabatkoder. En kode er tekst, en rabat er et præcist tal, og oprettelsen sker på et tidspunkt. Ved at vælge typer og defaults beskriver du, hvad hver oplysning betyder, før den første række indsættes.

> [!RAYMOND:question] Hvilken værdi må databasen selv vælge?
>
> Sammenlign `id`, `code` og `created_at` i startereksemplet. Hvad skal eleven eller appen levere, og hvad kan databasen generere? En default skal være en bevidst regel, ikke et gæt på manglende information.

## Hyppige typer i H1

| Type | Brug |
|------|------|
| `INT` / `BIGINT` | tællere, FK, id |
| `NUMERIC(p,s)` | penge (undgå `float` til beløb) |
| `TEXT` | tekst uden en angivet længdegrænse i skemaet |
| `VARCHAR(n)` | når I *vil* have max-længde |
| `BOOLEAN` | sand/falsk |
| `DATE` | kun dato |
| `TIMESTAMPTZ` | et tidspunkt, der kan vises i forskellige tidszoner |

## SERIAL vs IDENTITY

Raymond sammenligner her to **udsnit af en kolonnedefinition**. De skal stå inde i en fuld `CREATE TABLE`-sætning for at kunne køres.

```sql
-- Klassisk (stadig udbredt)
id SERIAL PRIMARY KEY

-- Moderne SQL-standard
id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

Begge kan generere nye tal. `GENERATED ALWAYS AS IDENTITY` markerer tydeligt, at databasen normalt leverer værdien; **unikheden kommer fra `PRIMARY KEY` eller `UNIQUE`**, ikke fra identity alene. Huller i talrækken er normale, eksempelvis efter afviste indsættelser.

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

> [!RAYMOND:skeptical] Et tal er ikke bare et tal
>
> Et beløb skal kunne sammenlignes og beregnes med den aftalte præcision. Forklar, hvorfor et omtrentligt flydende tal og `NUMERIC(10,2)` ikke er samme kontrakt. Skalaen kan give afrunding, så vælg også den bevidst.

## TEXT vs VARCHAR

Raymond vælger `VARCHAR(n)`, når en længdegrænse er et faktisk krav, eksempelvis en kode på højst 16 tegn. `TEXT` og `VARCHAR` uden grænse har ikke en generel hastighedsforskel, der i sig selv afgør valget i PostgreSQL.

## Tid og tidzoner

| Type | Brug |
|------|------|
| `DATE` | fødselsdag, ordredato uden klokkeslæt |
| `TIMESTAMP` | uden tidzone (undgå i distribuerede apps) |
| `TIMESTAMPTZ` | “skete hvornår” i den virkelige verden |

`now()` returnerer `timestamptz`. PostgreSQL gemmer tidspunktet normaliseret og viser det i sessionens tidszone; den oprindelige tidszonebetegnelse gemmes ikke i værdien. Har forretningen brug for eksempelvis navnet `Europe/Copenhagen`, skal det modelleres særskilt.

## Domæne vs. applikationstype

| SQL | C# (typisk) |
|-----|-------------|
| `INT` | `int` |
| `BIGINT` | `long` |
| `NUMERIC` | `decimal` |
| `TEXT` | `string` |
| `BOOLEAN` | `bool` |
| `TIMESTAMPTZ` | typisk UTC-`DateTime`; `DateTimeOffset` med offset 0 i Npgsql |
| `DATE` | `DateOnly` |

Forkerte mappinger (fx `float` til penge) giver snigende bugs.

## Prøv selv

Opret `promo_codes`, indsæt 2 koder, og kør:

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'promo_codes'
ORDER BY ordinal_position;
```

Argumentér: hvorfor `NUMERIC` til `discount_pct` og ikke `REAL`?

> [!RAYMOND:reading] Læs det, du faktisk oprettede
>
> Undersøg `promo_codes` i metadataoversigten. Forklar én datatype, én default og én constraint hver for sig. Hvilken del ville afvise en dubletkode, og hvilken del ville udfylde tidspunktet?

Kilde: [Npgsqls mapping af datoer, tidspunkter og UTC](https://www.npgsql.org/doc/types/datetime.html).
