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

Raymond skal vise en ordreliste med kunde- og produktnavne. Skærmen har brug for en flad rapportlinje, ikke en kopi af alle databasens tabeller som objektgrafer. Derfor starter han med resultatets form og vælger en DTO, der matcher den.

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

En **flad DTO** gør her udvælgelsen tydelig: én række indeholder netop det, rapporten viser. Raymond lader relationerne bo i databasen og skriver en JOIN, der samler dem til denne læseopgave.

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

> [!RAYMOND:question] To plausible tal kan stadig være byttet om
>
> `QueryMultiple` læses i samme rækkefølge som resultatsættene. Hvad sker der, hvis du bytter de to SELECTs, men beholder C#-linjerne? Begge tal kan se rimelige ud. Forklar, hvorfor **rækkefølge og betydning** er en del af kontrakten.

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
| Egen SQL til CRUD og rapporter med automatisk mapping | Dapper |
| Begge | samme SQL, samme parametre, samme transaktioner |

Vælg en tydelig hovedstil i DAL'en, og forklar eventuelle undtagelser. Raymond vurderer Dapper ud fra behovet for egen SQL og EF Core ud fra behovet for model, LINQ og ændringssporing; et valg skal kunne begrundes med projektets arbejde.

## Multi-mapping (kort kendskab)

Dapper kan splitte en JOIN-række ud i flere objekter (`QueryAsync<Order, Customer, Order>(…)`). Det er kraftfuldt — og nemt at gøre ulæseligt. Til H1: **flade DTO’er** først; multi-mapping kun hvis I har brug for nestede objekter.

## Buffered

`QueryAsync` buffer som udgangspunkt resultatet i hukommelsen. Den almindelige async-overload har ikke et `buffered: false`-argument. Nyere Dapper-versioner har `QueryUnbufferedAsync<T>` til `await foreach`; kontrollér den installerede versions API, og hold forbindelsen åben under hele gennemløbet. Streaming kræver derfor et bevidst valg af levetid og fejlhåndtering.

## Prøv selv

1. Kør Viborg-JOIN’en i SQL-H1.  
2. Definér `OrderLineDto` og skitsér `QueryAsync`.  
3. Skriv i README: “Vi bruger Dapper til X; rå Npgsql til Y (hvis noget).”

> [!RAYMOND:thinking] Tre forskellige problemer
>
> Forklar forskellen på **en JOIN-række til en DTO**, **flere resultatsæt fra QueryMultiple** og **flere skrivninger i en transaktion**. Hvilken af de tre mekanismer sikrer, at to ændringer enten gemmes sammen eller rulles tilbage sammen?

## Kilde

- [Dappers officielle async-API og implementering](https://github.com/DapperLib/Dapper/blob/main/Dapper/SqlMapper.Async.cs)
