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

Raymond mangler et sted at gemme caféens leverandører. Flere produktrækker løser ikke det problem; først skal der findes en passende tabel. Med **DDL** bygger du strukturen, som dine senere forespørgsler og ændringer skal arbejde med.

Du har **din egen Postgres-database**. Du må gerne eksperimentere med DDL — brug **Nulstil database**, hvis noget går galt.

## DDL vs DML vs DQL

| Familie | Eksempler | Ændrer |
|---------|-----------|--------|
| **DQL** | `SELECT` | intet (læser) |
| **DML** | `INSERT`, `UPDATE`, `DELETE` | **rækker** |
| **DDL** | `CREATE`, `ALTER`, `DROP` | **struktur** |
| **DCL** | `GRANT`, `REVOKE` | **rettigheder** |

Café-seed’en (`customers`, `products`, `orders`) er allerede DDL, der er kørt for dig. Nu skriver du den selv.

> [!RAYMOND:idea-notes] Tegn leverandøren før du bygger
>
> Hvilke oplysninger beskriver én leverandør, og hvilken nøgle kan udpege den? Skriv tre kolonner på papir. Så kan du forklare formålet med hver kolonne, når du læser `CREATE TABLE`.

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
| `NOT NULL` | værdien må ikke være `NULL`; tom tekst er stadig en værdi |
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

Det kan gøre en oprettelse genkørbar, men det kontrollerer ikke, at den eksisterende tabel har den ønskede struktur. Raymond bruger `ALTER` til ændringer, der skal bevare data, og opretter kun forfra i en afgrænset øvelse, hvor data må kasseres.

> [!RAYMOND:skeptical] Findes er ikke det samme som passer
>
> Startereksemplet har en enkel `suppliers`-tabel, mens det større eksempel også har `email`. Hvis tabellen allerede findes, tilføjer `IF NOT EXISTS` ikke det manglende felt. Sammenlign kolonnerne med din plan, før du fortsætter.

## Navngivning og schema

- Brug **snake_case** til tabeller/kolonner (`order_date`, ikke `OrderDate` i SQL).  
- Ét schema (`public`) er nok i H1; i større systemer ses `app`, `staging`, …  
- Undgå reserved words som kolonnenavne (`user`, `order` → `orders`).

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
```

## DDL er en kontrakt

Når I `CREATE TABLE`, lover I API’en og hinanden en struktur. Ændringer senere = **migration** (`ALTER`), ikke “ret det stille i prod”. I SQL-H1 må I eksperimentere frit — i projektet: script + review.

## Fejl du møder tidligt

| Fejl | Typisk årsag |
|------|----------------|
| `already exists` | tabel findes — `IF NOT EXISTS` eller `DROP` først |
| `syntax error` | manglende komma/parentes i kolonnelisten |
| `type … does not exist` | stavefejl i datatype |

## Prøv selv

1. Opret `suppliers` (eller et andet navn).
2. Indsæt 2 rækker.
3. Kør `SELECT` og kig også under **Database** (E/R opdateres efter dine tabeller).
4. List alle basistabeller via `information_schema`.

> Tip: Hold dig til små hjælpetabeller ved siden af caféen — eller nulstil, når du er færdig med eksperimentet.

> [!RAYMOND:reading] Læs kontrakten tilbage
>
> Vis din tabel i Database-oversigten. Forklar, hvordan en række identificeres, hvilke værdier der kræves, og hvilke databasen selv udfylder. Kan en makker indsætte en gyldig leverandør ud fra din forklaring?
