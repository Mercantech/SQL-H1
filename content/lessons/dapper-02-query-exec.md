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
