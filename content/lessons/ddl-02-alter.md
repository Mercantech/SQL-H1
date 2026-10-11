---
title: 2. ALTER TABLE og constraints i DDL
slug: ddl-02-alter
module: ddl-er
order: 2
kind: theory
objectives:
  - Ændre eksisterende tabeller med ALTER
  - Tilføje FK, UNIQUE og CHECK
  - Forstå at ALTER påvirker eksisterende data
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      city TEXT NOT NULL
    );
    ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone TEXT;
---

# ALTER TABLE og constraints i DDL

`CREATE` laver nyt. **`ALTER TABLE`** ændrer noget, der allerede findes — typisk i produktion, når systemet vokser.

## Tilføj kolonne

```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

ALTER TABLE suppliers
  ADD COLUMN phone TEXT;

-- Postgres 9.1+: undgå fejl hvis kolonnen allerede findes
ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS phone TEXT;
```

## NOT NULL på eksisterende data

Hvis tabellen allerede har rækker med `NULL` i kolonnen, fejler:

```sql
ALTER TABLE suppliers
  ALTER COLUMN phone SET NOT NULL;
```

Strategi: sæt værdier først (`UPDATE`), derefter `SET NOT NULL`.

## Fremmednøgle med ALTER

Kobling fra caféen til dine leverandører (eksempel):

```sql
ALTER TABLE products
  ADD COLUMN supplier_id INT;

ALTER TABLE products
  ADD CONSTRAINT products_supplier_fk
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
```

Nu må `supplier_id` kun pege på en eksisterende leverandør (eller være `NULL`, hvis du ikke sætter `NOT NULL`).

## UNIQUE og CHECK

```sql
ALTER TABLE suppliers
  ADD CONSTRAINT suppliers_name_unique UNIQUE (name);

ALTER TABLE products
  ADD CONSTRAINT products_price_positive CHECK (price > 0);
```

Prøv at bryde dem med DML — Postgres svarer med en fejl, præcis som I constraints-modulet.

## Omdøb / slet kolonne

```sql
ALTER TABLE suppliers RENAME COLUMN phone TO phone_number;

ALTER TABLE suppliers DROP COLUMN IF EXISTS phone_number;
```

`DROP COLUMN` sletter data i kolonnen — permanent (indtil du nulstiller seed).

## Rækkefølge betyder noget

1. Opret forældre-tabel (`suppliers`)
2. Tilføj FK-kolonne på barn (`products.supplier_id`)
3. Tilføj `FOREIGN KEY`-constraint
4. Først derefter: indsæt data der bruger FK

Samme tænkning som ved `DELETE` og cascading — **grafen** styrer rækkefølgen.
