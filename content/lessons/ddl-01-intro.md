---
title: 1. DDL — fra data til struktur
slug: ddl-01-intro
module: ddl-er
order: 1
kind: theory
objectives:
  - Skelne DDL fra DML og DQL
  - Oprette en tabel med CREATE TABLE
  - Vælge datatyper og PRIMARY KEY
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL
    );
    SELECT * FROM suppliers;
---

# DDL — fra data til struktur

Indtil nu har du mest **læst** (`SELECT`) og **ændret rækker** (`INSERT`/`UPDATE`/`DELETE`). Nu bygger du selve **skelettet**: tabeller, kolonner, nøgler og indeks.

Du har **din egen Postgres-database**. Du må gerne eksperimentere med DDL — brug **Nulstil database**, hvis noget går galt.

## DDL vs DML vs DQL

| Familie | Eksempler | Ændrer |
|---------|-----------|--------|
| **DQL** | `SELECT` | intet (læser) |
| **DML** | `INSERT`, `UPDATE`, `DELETE` | **rækker** |
| **DDL** | `CREATE`, `ALTER`, `DROP` | **struktur** |
| **DCL** | `GRANT`, `REVOKE` | **rettigheder** |

Café-seed’en (`customers`, `products`, `orders`) er allerede DDL, der er kørt for dig. Nu skriver du den selv.

## CREATE TABLE

```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  email TEXT,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);
```

| Del | Betydning |
|-----|-----------|
| `SERIAL` | auto-increment heltal (surrogat-PK) |
| `PRIMARY KEY` | unik identifikator for rækken |
| `NOT NULL` | kolonnen må ikke være tom |
| `DEFAULT` | værdi hvis du ikke angiver noget |
| `TEXT` / `NUMERIC` / `BOOLEAN` / `DATE` | datatype |

Tjek at tabellen findes:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

## Tilføj data (DML oven på dit DDL)

```sql
INSERT INTO suppliers (name, city) VALUES
  ('Nordic Beans', 'Aarhus'),
  ('Møller Mælk', 'Viborg');

SELECT * FROM suppliers;
```

## IF NOT EXISTS / IF EXISTS

```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);
```

Godt når du kører scripts flere gange — men i undervisning er det ofte klarere at **DROP** og oprette forfra, når du øver dig.

## Prøv selv

1. Opret `suppliers` (eller et andet navn).
2. Indsæt 2 rækker.
3. Kør `SELECT` og kig også under **Database** (E/R opdateres efter dine tabeller).

> Tip: Hold dig til små hjælpetabeller ved siden af caféen — eller nulstil, når du er færdig med eksperimentet.
