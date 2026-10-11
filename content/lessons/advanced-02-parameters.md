---
title: 2. Parametre og sikker SQL
slug: advanced-02-parameters
module: advanced
order: 2
kind: theory
objectives:
  - Forstå hvorfor streng-sammensat SQL er farligt
  - Kende parametre / prepared statements
  - Se parametre i Postgres-funktioner
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE FUNCTION product_price(p_name TEXT)
    RETURNS NUMERIC
    LANGUAGE sql
    STABLE
    AS $$
      SELECT price FROM products WHERE name = p_name;
    $$;
    SELECT product_price('Espresso');
---

# Parametre og sikker SQL

## Det farlige mønster

Hvis en app bygger SQL sådan her:

```text
"SELECT * FROM customers WHERE name = '" + userInput + "'"
```

kan en bruger indtaste `x' OR '1'='1` og lække hele tabellen. Det kaldes **SQL injection**.

## Løsningen: parametre

I .NET (Npgsql/Dapper) bruger du **placeholders**:

```csharp
cmd.CommandText = "SELECT * FROM customers WHERE name = @name";
cmd.Parameters.AddWithValue("name", userInput);
```

Værdien sendes **separat** fra SQL-teksten — den kan ikke “bryde ud” af strengen.

I SQL-H1-editoren skriver du SQL direkte (du *er* eleven). I projektet skal I **altid** bruge parametre fra C#.

## Parametre i Postgres-funktioner

```sql
CREATE OR REPLACE FUNCTION product_price(p_name TEXT)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT price FROM products WHERE name = p_name;
$$;

SELECT product_price('Espresso');
SELECT product_price('Latte');
```

Her er `p_name` en ægte parameter — ikke streng-konkatenering.

## Kontrolstrukturer (smagsprøve)

I `plpgsql` kan du bruge `IF` / `LOOP` (næste modul uddyber):

```sql
CREATE OR REPLACE FUNCTION stock_label(p_in_stock BOOLEAN)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_in_stock THEN
    RETURN 'På lager';
  ELSE
    RETURN 'Udsolgt';
  END IF;
END;
$$;

SELECT name, stock_label(in_stock) FROM products ORDER BY name;
```

## Takeaway til projektet

| Lag | Gør |
|-----|-----|
| C# API | Parametre i alle forespørgsler |
| Postgres | Views + GRANT til least privilege |
| Elev-DB her | Øv funktioner/views — men husk injection, når I bygger API |
