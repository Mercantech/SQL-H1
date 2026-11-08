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

Raymond vil vise caféens kunder fra Viborg i en C#-liste. Forespørgslen kender du allerede; nu skal hver kolonne oversættes til den rigtige .NET-type. Følg én række fra SQL-resultat til objekt, før du bygger resten af API'en.

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

> [!RAYMOND:question] Hvilken form har svaret?
>
> Vælg metode til **en kundeliste**, **antal berørte rækker** og **ét nyt id**. Begrund valget ud fra resultatets form. Et `INSERT … RETURNING id` er stadig en skrivning, selv om du bruger `ExecuteScalarAsync` til at læse svaret.

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

Raymond tilføjer `email` til kundelisten. Linjen nedenfor er en separat skitse: den forudsætter, at du også tilføjer `email` som **fjerde kolonne** i SELECT-listen. Det første eksempel vælger kun tre kolonner og har derfor intet indeks 3.

```csharp
string? email = reader.IsDBNull(3) ? null : reader.GetString(3);
```

`IsDBNull` undersøger SQL-resultatets manglende værdi, som du her mapper til en nullable `string?` i C#. SQL's tre-værdi-logik gælder i forespørgslen; den bliver ikke automatisk til samme logik i dine C#-betingelser.

## Ordinal vs. navn

```csharp
var name = reader.GetString(reader.GetOrdinal("name"));
```

Navne gør hensigten tydeligere og tåler ændret kolonnerækkefølge, men det valgte navn og datatypen skal stadig passe. Ved mange rækker kan du slå ordinalen op én gang før løkken og genbruge den.

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

> [!RAYMOND:testing] Følg den manglende e-mail
>
> Vis, hvor `email` vælges, hvor SQL `NULL` kontrolleres, og hvor resultatet bliver til `string?`. Hvad gør `ReadAsync`-løkken, hvis ingen kunder matcher byen? Forklar forskellen på **ingen rækker** og **en række med en NULL-kolonne**.
