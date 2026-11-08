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

Raymond har læst caféens tabeller i SQL-H1. Nu skal en lokal C#-applikation læse de samme data. Første opgave er at åbne den rigtige database med den rigtige rolle og frigive forbindelsen efter brug.

**ADO.NET** giver .NET fælles begreber som connections, commands og readers. **Npgsql** er provideren, der forbinder dem med PostgreSQL.

> [!RAYMOND:reading] To arbejdssteder
>
> Kør **SQL** i SQL-H1. Kør **C#** i en lokal console eller jeres API med Npgsql installeret og en egnet projekt-database. Hvilken del af C#-eksemplet åbner forbindelsen, og hvilken del sender senere SQL til serveren?

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

`await using` frigiver forbindelsen, også hvis arbejdet kaster en exception. Raymond lader derfor forbindelsens levetid følge det arbejde, der skal udføres. Direkte `NpgsqlConnection` er understøttet; i større applikationer anbefaler Npgsql en delt **`NpgsqlDataSource`**, hvorfra man åbner kortlivede forbindelser.

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

## Connection string-byggeklodser

| Nøgle | Eksempel | Note |
|-------|----------|------|
| Host | `localhost` / `db` | Compose-servicenavn internt |
| Port | `5432` | standard Postgres |
| Database | `cafe` | ikke forveksle med server |
| Username / Password | env | aldrig commit |
| SSL Mode | fx `VerifyFull` | vælg efter miljøets TLS- og certifikatkrav |

Npgsql bruger formatet **`nøgle=værdi;…`** ovenfor. Hvis hosting leverer en `postgres://…`-URI, skal konfigurationen omsættes til Npgsqls felter, fx med `NpgsqlConnectionStringBuilder`; send ikke URI'en direkte til konstruktøren. Lokale laboratorier og eksterne servere kan have forskellige TLS-krav. Kryptering og kontrol af servercertifikatet skal vælges bevidst.

## Fejl ved opstart

| Symptom | Tjek |
|---------|------|
| Timeout | forkert host/port, DB ikke oppe |
| Auth failed | user/password/env |
| Database does not exist | `POSTGRES_DB` / forkert navn |

## Prøv selv

1. Kør SQL’en øverst i SQL-H1.  
2. Skriv (lokalt) en minimal console der åbner Npgsql og kører samme SQL.  
3. Luk med `await using` — ingen lækket connection.

> [!RAYMOND:thinking] Forklar din forbindelse
>
> Udpeg **host**, **database** og **rolle** uden at vise et password. Forklar derefter, hvad der sker ved `Dispose`, når pooling er aktiv: hvorfor behøver en frigivet forbindelse ikke betyde, at den fysiske forbindelse til serveren lukkes?

## Kilder

- [Npgsql: grundlæggende brug og data source](https://www.npgsql.org/doc/basic-usage.html)
- [Npgsql: connection string-parametre](https://www.npgsql.org/doc/connection-string-parameters.html)
