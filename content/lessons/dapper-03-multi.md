---
title: 3. JOIN-mapping, multi-result og transaktioner
slug: dapper-03-multi
module: dapper
order: 3
kind: theory
objectives:
  - Mappe JOIN til DTO’er
  - Kende QueryMultiple
  - Køre flere statements i én transaktion
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT
      c.name AS kunde,
      p.name AS produkt,
      o.quantity,
      o.order_date
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    WHERE c.city = 'Viborg'
    ORDER BY o.order_date;
---

# JOIN-mapping, multi-result og transaktioner

## Flad DTO fra JOIN (simpelt og godt)

```csharp
public sealed record OrderLineDto(
    string Kunde, string Produkt, int Quantity, DateOnly OrderDate);

var lines = await conn.QueryAsync<OrderLineDto>(
    """
    SELECT
      c.name AS Kunde,
      p.name AS Produkt,
      o.quantity AS Quantity,
      o.order_date AS OrderDate
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    WHERE c.city = @city
    ORDER BY o.order_date
    """,
    new { city = "Viborg" });
```

Til H1 er **flade DTO’er** næsten altid klarere end avanceret multi-mapping.

## QueryMultiple (to resultsets)

```csharp
await using var multi = await conn.QueryMultipleAsync(
    """
    SELECT COUNT(*) FROM customers;
    SELECT COUNT(*) FROM products;
    """);

var customerCount = await multi.ReadSingleAsync<int>();
var productCount = await multi.ReadSingleAsync<int>();
```

## Transaktion med Dapper

```csharp
await using var conn = new NpgsqlConnection(cs);
await conn.OpenAsync();
await using var tx = await conn.BeginTransactionAsync();

await conn.ExecuteAsync(
    "UPDATE products SET in_stock = FALSE WHERE name = @name",
    new { name = "Chokoladebolle" },
    tx);

await conn.ExecuteAsync(
    """
    INSERT INTO orders (customer_id, product_id, quantity, order_date)
    VALUES (@cid, @pid, @qty, CURRENT_DATE)
    """,
    new { cid = 1, pid = 1, qty = 1 },
    tx);

await tx.CommitAsync();
```

## ADO.NET vs Dapper — hvornår hvad?

| Behov | Værktøj |
|-------|---------|
| Lære fundamentals / specielle reader-flows | ADO.NET |
| 95% af API CRUD + rapporter | Dapper |
| Begge | samme SQL, samme parametre, samme transaktioner |

Næste skridt i projektet: vælg **én** stil i DAL’en (helst Dapper oven på Npgsql) og vær konsekvente.
