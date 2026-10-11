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

Postgres er ikke “én fil med tabeller”. Det er en **serverproces**, der hoster mange **databaser**, hver med **schemas**, **roller** og **objekter**.

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

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Brug katalogerne til at **dokumentere** og **fejlsøge** — samme data, som **Database**-siden viser grafisk.

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
