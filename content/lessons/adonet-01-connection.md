---
title: 1. ADO.NET — connection og Npgsql
slug: adonet-01-connection
module: adonet
order: 1
kind: theory
objectives:
  - Forklare ADO.NET som dataadgangs-API
  - Åbne/lukke connections korrekt
  - Læse connection string fra konfiguration
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT current_database() AS db, current_user AS rolle;
---

# ADO.NET — connection og Npgsql

**ADO.NET** er .NET’s klassiske lag til databaser: connections, commands, readers. Mod Postgres bruger I typisk pakken **`Npgsql`**.

> SQL-H1’s editor kører **SQL**. C#-eksemplerne her kopierer I til jeres H1-API / console — men SQL’en I øver, er den samme.

## Lagene

```text
Controller/Minimal API
        ↓
   Repository / DAL
        ↓
  NpgsqlConnection  →  Postgres
```

## Connection string

```text
Host=localhost;Port=5432;Database=cafe;Username=app;Password=***
```

I Docker Compose: `Host=db` (servicenavn). Læg den i **env** / `appsettings` — ikke i git.

## Åbn og luk (using)

```csharp
using Npgsql;

await using var conn = new NpgsqlConnection(connectionString);
await conn.OpenAsync();

// ... arbejde ...

// Dispose lukker connection (connection pooling genbruger den under hood)
```

`await using` sikrer, at connection lukkes — også ved exceptions.

## Connection pooling

Npgsql **pooler** connections automatisk. Derfor:

- Åbn sent, luk tidligt (lad `using` styre det)
- Undgå én global åben connection i hele appens levetid
- Undgå at åbne hundredvis samtidigt uden grund

## Bro til SQL-H1

I har allerede en elev-DB. Tænk: *hvis min API skulle læse caféen, hvilken connection string og hvilket SQL?*

```sql
SELECT current_database() AS db, current_user AS rolle;
```
