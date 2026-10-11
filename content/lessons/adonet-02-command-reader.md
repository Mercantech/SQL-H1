---
title: 2. Command og DataReader
slug: adonet-02-command-reader
module: adonet
order: 2
kind: theory
objectives:
  - Køre SELECT med NpgsqlCommand
  - Læse rækker med ExecuteReader
  - Skelne ExecuteReader / ExecuteNonQuery / ExecuteScalar
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT id, name, city FROM customers WHERE city = 'Viborg' ORDER BY name;
---

# Command og DataReader

## SELECT → DataReader

```csharp
await using var conn = new NpgsqlConnection(cs);
await conn.OpenAsync();

await using var cmd = new NpgsqlCommand(
    """
    SELECT id, name, city
    FROM customers
    WHERE city = @city
    ORDER BY name
    """,
    conn);

cmd.Parameters.AddWithValue("city", "Viborg");

await using var reader = await cmd.ExecuteReaderAsync();
while (await reader.ReadAsync())
{
    var id = reader.GetInt32(0);
    var name = reader.GetString(1);
    var city = reader.GetString(2);
    // map til DTO / record
}
```

Øv SQL’en her i SQL-H1:

```sql
SELECT id, name, city
FROM customers
WHERE city = 'Viborg'
ORDER BY name;
```

## Tre Execute-metoder

| Metode | Bruges til | Returnerer |
|--------|------------|------------|
| `ExecuteReaderAsync` | `SELECT` (flere rækker/kolonner) | `DbDataReader` |
| `ExecuteNonQueryAsync` | `INSERT`/`UPDATE`/`DELETE` | antal berørte rækker |
| `ExecuteScalarAsync` | én værdi (`COUNT`, `RETURNING id`) | `object?` |

## INSERT med RETURNING (scalar)

```csharp
await using var cmd = new NpgsqlCommand(
    """
    INSERT INTO customers (name, city)
    VALUES (@name, @city)
    RETURNING id
    """,
    conn);
cmd.Parameters.AddWithValue("name", "Gina Berg");
cmd.Parameters.AddWithValue("city", "Randers");
var newId = (int)(await cmd.ExecuteScalarAsync())!;
```

## NULL fra reader

```csharp
string? email = reader.IsDBNull(3) ? null : reader.GetString(3);
```

Samme tre-værdi-logik som i SQL — husk `IS NULL` / `COALESCE` når I designer forespørgslen.

## Ordinal vs. navn

```csharp
var name = reader.GetString(reader.GetOrdinal("name"));
```

Navne er mere robuste end hårde indeks, hvis `SELECT`-listen ændrer sig.

## CommandTimeout

```csharp
cmd.CommandTimeout = 30; // sekunder
```

Undgå at hænge request-tråde på tunge queries — sæt timeout bevidst.

## Buffret vs. streaming

`ExecuteReaderAsync` streamer rækker. Materialisér til liste/DTO i repository, så controlleren ikke holder reader åben.

## Prøv selv

1. Kør Viborg-SQL’en i SQL-H1.  
2. Skriv C#-skitsen der mapper til `record Customer(int Id, string Name, string City)`.  
3. Håndter `email` som nullable.
