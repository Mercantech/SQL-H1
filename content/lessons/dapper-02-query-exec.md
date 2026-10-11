---
title: 2. Query, Execute og parametre
slug: dapper-02-query-exec
module: dapper
order: 2
kind: theory
objectives:
  - Bruge QueryAsync / QuerySingleOrDefaultAsync
  - Bruge ExecuteAsync til DML
  - Sende anonyme parametre sikkert
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    SELECT id, name, price FROM products WHERE category = 'Drikke' ORDER BY name;
---

# Query, Execute og parametre

## Query med parametre

```csharp
var drikkke = await conn.QueryAsync<Product>(
    """
    SELECT id AS Id, name AS Name, price AS Price, category AS Category
    FROM products
    WHERE category = @category
    ORDER BY name
    """,
    new { category = "Drikke" });
```

Parametre er **ikke** streng-konkat — Dapper/Npgsql sender dem sikkert (samme princip som ADO.NET).

## Én række

```csharp
var product = await conn.QuerySingleOrDefaultAsync<Product>(
    "SELECT id AS Id, name AS Name, price AS Price, category AS Category FROM products WHERE name = @name",
    new { name = "Espresso" });

if (product is null) { /* 404 */ }
```

## Execute (DML)

```csharp
var rows = await conn.ExecuteAsync(
    """
    UPDATE products
    SET price = @price
    WHERE name = @name
    """,
    new { price = 29.00m, name = "Espresso" });
```

## RETURNING med QuerySingle

```csharp
var id = await conn.QuerySingleAsync<int>(
    """
    INSERT INTO customers (name, city, email)
    VALUES (@Name, @City, @Email)
    RETURNING id
    """,
    new { Name = "Gina Berg", City = "Randers", Email = (string?)null });
```

## Øv SQL’en

```sql
SELECT id, name, price
FROM products
WHERE category = 'Drikke'
ORDER BY name;
```

## QueryFirst vs. Single

| Metode | Forventning |
|--------|-------------|
| `QueryFirstAsync` | mindst én — tager første |
| `QueryFirstOrDefaultAsync` | 0 eller flere — null hvis 0 |
| `QuerySingleAsync` | præcis én — ellers exception |
| `QuerySingleOrDefaultAsync` | 0 eller 1 |

Brug `Single` når PK-opslag *skal* være unikt.

## Dynamiske parametre

```csharp
var p = new DynamicParameters();
p.Add("category", "Drikke");
p.Add("min_price", 30m);
```

Nyttigt når I bygger WHERE dynamisk — stadig parametre, aldrig streng-konkat af værdier.

## Prøv selv

1. Kør drikke-SQL’en.  
2. Skitsér `GetByCategoryAsync` med Dapper.  
3. Skitsér `UpdatePriceAsync` med `ExecuteAsync` + tjek `rows == 1`.
