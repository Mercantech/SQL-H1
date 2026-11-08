---
title: 1. Databaseserver og metadata
slug: drift-01-metadata
module: drift
order: 1
kind: theory
objectives:
  - Forklare Postgres som server med mange databaser
  - Læse metadata via information_schema / pg_catalog
  - Kende elev-DB vs fælles server
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT current_database() AS db, current_user AS rolle;
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
---

# Databaseserver og metadata

Raymond ser tabellen `orders` i to forbindelser. Er det samme database? Før han ændrer noget, beder han dig undersøge forbindelsen og læse dens metadata.

En Postgres-instans kan indeholde mange **databaser**. Hver database indeholder **schemas** og objekter som tabeller og views. **Roller** hører til hele instansen og får rettigheder til de relevante databaser og objekter.

I SQL-H1:

| Lag | Hvad |
|-----|------|
| **Server** | Fælles Postgres (Docker på Dokploy / lokalt) |
| **Din database** | Provisioneret til dig (`student_…`) |
| **public** | Dit arbejdsschema (café-seed + dine eksperimenter) |

## Hvem er jeg?

```sql
SELECT current_database() AS db, current_user AS rolle, version() AS postgres;
```

## information_schema — standardiseret katalog

```sql
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;
```

## pg_catalog — Postgres’ eget

> [!RAYMOND:reading] Beskriv beholderen og indholdet
>
> `information_schema.columns` fortæller, at `orders` har en kolonne ved navn `customer_id`. Fortæller den også, hvilke kunder der har bestilt? Skeln mellem **metadata** om tabellen og **rækkerne** i den, før du vælger din næste forespørgsel.

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Raymond bruger katalogerne til at kontrollere sin dokumentation: findes det indeks, tegningen lover, og må rollen se det? Katalogforespørgslerne viser metadata for den aktuelle forbindelse; **Database**-siden præsenterer mange af de samme oplysninger grafisk.

## Det du *ikke* må i sandboxen

Af sikkerhedshensyn er bl.a. blokeret:

- `CREATE`/`DROP DATABASE`
- `CREATE`/`DROP ROLE`
- `COPY` til/fra filer på serveren
- `CREATE EXTENSION`

I undervisningen/Docker som admin kan underviseren godt vise de ting uden for elev-sandboxen.

## Server → database → schema → objekt

```text
Postgres-instans (port 5432)
  ├── database sqlh1          (app/metadata)
  ├── database student_…      (din sandbox)
  │     └── schema public
  │           ├── tables
  │           ├── views
  │           ├── functions
  │           └── indexes
  └── roller / privileges
```

## Nyttige katalogforespørgsler

```sql
-- Kolonner + nullability
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'orders'
ORDER BY ordinal_position;

-- Constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND table_name = 'orders';
```

## Prøv selv

1. Kør `current_database` / `version()`.  
2. List tabeller og indeks.  
3. Find alle FK i `public` via `information_schema` (som i DDL/E/R-lektionen).

> [!RAYMOND:thinking] Tegn forbindelsen
>
> Vis din makker vejen fra **server** til **database**, **schema** og **tabel**. Placér derefter rollen på tegningen, og brug `current_database()` og `current_user` til at dokumentere, hvor dine forespørgsler faktisk kører.
