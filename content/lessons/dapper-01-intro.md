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

**Dapper** er et tyndt lag (*micro-ORM*) oven på ADO.NET: I skriver stadig SQL, men slipper for manuel `GetInt32`/`GetString`-mapping.

```text
Rå NpgsqlCommand + Reader  →  meget kontrol, meget boilerplate
Dapper                     →  SQL + automatisk mapping
EF Core                    →  LINQ, change tracker (tyngre — ikke H1-fokus her)
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

Dapper mapper kolonnenavne → properties (pas på casing; aliases hjælper).

## Samme SQL i SQL-H1

```sql
SELECT id, name, city, email
FROM customers
ORDER BY id
LIMIT 5;
```

## Hvornår Dapper?

| Vælg Dapper når | Overvej noget andet når |
|-----------------|-------------------------|
| I vil eje SQL’en | I vil have fuld change-tracker |
| API’en er CRUD + rapporter | Kompleks objektgraf med lazy load |
| Performance og enkelhed tæller | Teamet allerede er tungt i EF |
