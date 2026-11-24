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

En gæst i caféen har en apostrof i sit navn. Raymond vil kunne finde gæsten uden at ændre navnet og uden at lade teksten ændre SQL-koden. Det kræver, at programmet holder **værdier og SQL-struktur adskilt**.

```teach
{
  "question": "Kundesøgningen skal finde O'Neil præcis som skrevet. Hvilke to værdier afleverer C#-koden til databasedriveren?",
  "answer": "Giv driveren en fast SQL-tekst med en placeholder og navnet O'Neil som separat parameterværdi. Så kan apostroffen bevares, og databasen sammenligner hele navnet."
}
```

> [!RAYMOND:question] Et navn er stadig data
>
> Hvis input indeholder en apostrof, hvorfor er løsningen så ikke bare at fjerne tegnet? Beskriv, hvordan databasen skal forstå værdien, også når den ligner et stykke SQL.

## Det farlige mønster

Hvis en app bygger SQL sådan her:

```text
"SELECT * FROM customers WHERE name = '" + userInput + "'"
```

kan en apostrof i navnet ændre SQL-tekstens betydning. Når brugerinput kan ændre en forespørgsels struktur, opstår risikoen for **SQL injection**.

## Løsningen: parametre

I .NET (Npgsql/Dapper) bruger du **placeholders**:

```csharp
cmd.CommandText = "SELECT * FROM customers WHERE name = @name";
cmd.Parameters.AddWithValue("name", userInput);
```

Værdien sendes **separat** fra SQL-teksten og behandles som data. Raymond lader også navne med apostroffer blive hele; han ændrer måden forespørgslen bygges på, ikke gæstens navn.

I SQL-editoren skriver du SQL direkte (du *er* eleven). I projektet skal I **altid** bruge parametre fra C#.

En værdiparameter kan ikke erstatte et tabelnavn, kolonnenavn eller `ASC`/`DESC`. Skal brugeren vælge sortering, vælger programmet mellem faste tilladte SQL-fragmenter. Se den konkrete allowlist i [sikkerhedsforløbet](/learn/security-01-threats).

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

Her indgår `p_name` som værdi i en fast SQL-definition. Raymond understreger forskellen fra en funktion, der selv sammensætter dynamisk SQL af brugerinput: den bliver ikke automatisk sikker, blot fordi den kaldes en funktion.

> [!RAYMOND:safe-lock] Se efter, hvad der faktisk sammensættes
>
> Find SQL-teksten og parameteroprettelsen i C#-eksemplet. Hvilken af dem indeholder værdien? Brug samme kontrol, når du læser Dapper-kode eller en funktion med dynamisk SQL.

## Kontrolstrukturer (smagsprøve)

PL/pgSQL har kontrolstrukturer. Raymond starter med `IF`: en betingelse vælger, hvilken værdi funktionen returnerer. Funktioner og fejlhåndtering uddybes i det næste modul:

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

## Tag med til projektet

| Lag | Gør |
|-----|-----|
| C# API | Parametre i alle forespørgsler |
| Postgres | Views + GRANT til least privilege |
| Elev-DB her | Øv funktioner/views — men husk injection, når I bygger API |

## To kontroller af kundesøgningen

| Input | Forventet bevis |
|---|---|
| Et eksisterende navn med apostrof | Søgningen bevarer hele navnet og returnerer netop den kendte kunde. |
| Et ukendt navn med apostrof | Søgningen giver nul rækker og kan genbruges med et andet navn. |

Vis makkeren den ene faste SQL-tekst og parameterværdierne fra de to kald. Kontroller også forbindelsens læserettigheder i [rettighedsopgaven](/learn/advanced-ex-01).

## ORM vs. rå SQL

Dapper/ADO.NET beskytter **kun**, hvis I bruger parametre.  
`QueryAsync("… WHERE name = '" + name + "'")` er stadig farligt.

## Prøv selv

1. Opret `product_price` og kald den med to produktnavne.  
2. Skriv det parametriserede C#-kald med `@name` og vis, hvor navnet tilføjes som parameterværdi.
3. Forklar hvorfor `product_price(p_name TEXT)` ikke er injection, selvom input kommer udefra.

> [!RAYMOND:idea-notes] Forklar grænsen mellem kode og data
>
> Peg på én sikker værdiparameter og én situation, der kræver en fast liste over tilladte SQL-navne. Hvorfor løser det ikke problemet at pakke en usikker sammensat streng ind i Dapper?

[Npgsql om parametre](https://www.npgsql.org/doc/basic-usage.html).
