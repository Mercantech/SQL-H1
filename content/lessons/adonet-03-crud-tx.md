---
title: 3. CRUD, parametre og transaktioner
slug: adonet-03-crud-tx
module: adonet
order: 3
kind: theory
objectives:
  - Skrive parametriseret CRUD
  - Undgå SQL injection
  - Bruge transaktioner i ADO.NET
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    BEGIN;
    INSERT INTO orders (customer_id, product_id, quantity, order_date)
    VALUES (1, 1, 1, CURRENT_DATE)
    RETURNING id;
    COMMIT;
---

# CRUD, parametre og transaktioner

Raymond skal oprette en caféordre både for en registreret kunde og for en gæst uden kundekonto. Den samme metode skal håndtere nullable `customerId`, beskytte brugerinput og kunne indgå i en samlet transaktion.

## Aldrig streng-sammensæt SQL med brugerinput

```csharp
// FORKERT — SQL injection
var sql = "SELECT * FROM customers WHERE name = '" + name + "'";

// RIGTIGT
cmd.CommandText = "SELECT * FROM customers WHERE name = @name";
cmd.Parameters.AddWithValue("name", name);
```

Et navn som `O'Connor` skal behandles som én værdi, uden at apostroffen ændrer SQL'ens struktur. Raymond holder derfor **SQL-tekst** og **parameterværdier** adskilt. Parametre erstatter ikke validering eller rettigheder, men sørger for, at værdier ikke fortolkes som SQL-kode.

## Repository-skitse

```csharp
public async Task<int> CreateOrderAsync(int? customerId, int productId, int qty)
{
    await using var conn = new NpgsqlConnection(_cs);
    await conn.OpenAsync();
    await using var tx = await conn.BeginTransactionAsync();

    await using var cmd = new NpgsqlCommand(
        """
        INSERT INTO orders (customer_id, product_id, quantity, order_date)
        VALUES (@cid, @pid, @qty, CURRENT_DATE)
        RETURNING id
        """,
        conn,
        tx);

    cmd.Parameters.AddWithValue("cid", NpgsqlTypes.NpgsqlDbType.Integer, (object?)customerId ?? DBNull.Value);
    cmd.Parameters.AddWithValue("pid", productId);
    cmd.Parameters.AddWithValue("qty", qty);

    var id = (int)(await cmd.ExecuteScalarAsync())!;
    await tx.CommitAsync();
    return id;
}
```

Øv den tilsvarende SQL (med konkrete værdier) i editoren:

```sql
INSERT INTO orders (customer_id, product_id, quantity, order_date)
VALUES (1, 1, 1, CURRENT_DATE)
RETURNING id;
```

## Fejl → Rollback

> [!RAYMOND:transaction] Hvilke ændringer skal følges ad?
>
> Ét `INSERT` er allerede atomisk. Forestil dig, at Raymond også skal reservere lager i et ekstra command: hvad skal ske med ordren, hvis reservationen fejler? Begge commands skal bruge **samme forbindelse og transaktion**, før ét samlet `CommitAsync` giver mening.

Hvis `Execute*` kaster, og I ikke comitter, ruller `await using` typisk transaktionen tilbage ved dispose — men vær eksplicit:

```csharp
try
{
    // flere commands på samme tx
    await tx.CommitAsync();
}
catch
{
    await tx.RollbackAsync();
    throw;
}
```

## Checkliste før I kalder det “færdig DAL”

- [ ] Alle brugerstyrede værdier er parametre  
- [ ] Connections i `await using`  
- [ ] Multi-step skrivning i transaktion  
- [ ] `RETURNING` til nye id’er  
- [ ] DTO’er — ikke `DataTable` overalt i API’en  

## DBNull vs. null

```csharp
cmd.Parameters.AddWithValue("cid", NpgsqlTypes.NpgsqlDbType.Integer, (object?)customerId ?? DBNull.Value);
```

I dette parameter-API repræsenterer `DBNull.Value` SQL `NULL`. Den eksplicitte **Integer**-type fortæller Npgsql, hvilken PostgreSQL-type parameteren har, også når der ikke findes en C#-heltalsværdi at udlede typen fra.

## Isolation af SQL

Hold SQL i repository/DAL — ikke i controllers. Så kan I:

- genbruge queries  
- teste dem i SQL-H1 først  
- skifte til Dapper senere uden at røre endpoints  

## Fejl → HTTP

| Postgres | Typisk API |
|----------|------------|
| unique_violation | 409 Conflict |
| foreign_key_violation | 400/409 |
| check_violation | 400 |
| timeout | 503 / 504 |

## Prøv selv

1. Kør `INSERT … RETURNING` for en ordre i SQL-H1.  
2. Skitsér `CreateOrderAsync` med transaktion.  
3. List tre ting fra checklisten I vil kræve i code review.

> [!RAYMOND:testing] Afprøv begge slags kunde
>
> Kør C#-metoden **lokalt mod en testdatabase** med et gyldigt kunde-id og med `null`. Prøv derefter et produkt-id, der ikke findes. Forklar, hvornår du får et nyt ordre-id, og hvornår databasen afviser ordren; vis, at afvisningen ikke efterlader en halv ordre.

## Kilde

- [Npgsql: parametre, datatyper og transaktioner](https://www.npgsql.org/doc/basic-usage.html)
