---
title: 1. Dapper — micro-ORM oven på ADO.NET
slug: dapper-01-intro
module: dapper
order: 1
kind: theory
objectives:
  - Forklare Dapper ift. rå ADO.NET og tunge ORM’er
  - Installere og kalde QueryAsync
  - Mappe til POCOs / records
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT id, name, city, email FROM customers ORDER BY id LIMIT 5;
---

# Dapper — micro-ORM oven på ADO.NET

Raymond har en gennemprøvet kunderapport, men dens reader-løkke fylder mere end selve forespørgslen. Med **Dapper** beholder han SQL'en og lader et tyndt mappinglag (*micro-ORM*) danne C#-objekterne.

```text
Rå NpgsqlCommand + Reader  →  meget kontrol, meget boilerplate
Dapper                     →  SQL + automatisk mapping
EF Core                    →  LINQ, change tracker og migrationer
```

## NuGet

```text
Dapper
Npgsql
```

## Første Query

```csharp
using Dapper;
using Npgsql;

public sealed record Customer(int Id, string Name, string City, string? Email);

await using var conn = new NpgsqlConnection(cs);

var customers = await conn.QueryAsync<Customer>(
    """
    SELECT id AS Id, name AS Name, city AS City, email AS Email
    FROM customers
    ORDER BY id
    LIMIT 5
    """);
```

Dapper matcher resultatets kolonnenavne og typer med objektet. For denne `record` sker det gennem dens konstruktør. Aliaserne gør kontrakten mellem SQL-resultat og C#-model synlig. C#-eksemplerne køres lokalt med Dapper og Npgsql; SQL-H1's editor bruges til SQL'en.

## Samme SQL i SQL-H1

```sql
SELECT id, name, city, email
FROM customers
ORDER BY id
LIMIT 5;
```

## Hvornår Dapper?

> [!RAYMOND:question] Hvad forsvandt fra reader-løkken?
>
> Sammenlign med ADO.NET-eksemplet: hvem læser nu `Id`, `Name` og `Email` ind i objektet? Peg også på det arbejde, Raymond stadig ejer: **filtrering**, **kolonnevalg**, **NULL-håndtering** og en korrekt JOIN bliver ikke automatisk rigtigt af at bruge Dapper.

| Vælg Dapper når | Overvej noget andet når |
|-----------------|-------------------------|
| I vil eje SQL’en | I vil have fuld change-tracker |
| API’en er CRUD + rapporter | Kompleks objektgraf med lazy load |
| Performance og enkelhed tæller | Teamet allerede er tungt i EF |

## Mapping-regler (praktisk)

- Kolonnenavne matches case-insensitive til properties  
- Brug `AS Id` hvis SQL er `id` og property er `Id` (virker ofte alligevel)  
- `record` / `class` med `get`/`init` fungerer fint  
- Match NULL-bare kolonner til `string?`, `int?`, …

Raymond vælger ud fra, hvem der skal formulere SQL og vedligeholde datamodellen. I [ORM-forløbet](/learn/orm-01-intro) prøver du EF Core, der også kan oversætte LINQ og holde styr på ændringer. Begge arbejder stadig mod en database; de er forskellige måder at få adgang til den på.

## Hvad Dapper *ikke* er

- Ikke change tracker (ingen `SaveChanges`)  
- Ikke automatiske migrationer  
- Ikke beskyttelse mod dårlig SQL — I ejer den stadig  

## Prøv selv

1. Kør kundelisten i SQL-H1.  
2. Skriv `Customer`-record og `QueryAsync`-kaldet.  
3. Sammenlign linjetal med rå ADO.NET-reader-løkke.

> [!RAYMOND:thinking] Tegn mappingkontrakten
>
> Forbind hver valgt SQL-kolonne med et felt i `Customer`. Hvad sker der med et manglende eller forkert typet felt? Forklar til sidst, hvorfor det at skrive en ny `record` **ikke** i sig selv opretter en tabel eller ændrer databasen.
