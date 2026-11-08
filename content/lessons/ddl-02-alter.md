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

Raymond har allerede gemt leverandører, da caféen får brug for deres telefonnumre. Han vil bevare rækkerne og ændre strukturen med **`ALTER TABLE`**. Nu skal du både tænke på det nye skema og på de data, der allerede ligger der.

> [!RAYMOND:question] Hvad får de gamle rækker?
>
> Du tilføjer `phone TEXT` uden default til en tabel med leverandører. Hvad vil de eksisterende rækker have i den nye kolonne? Forudsig svaret, før du forsøger at gøre feltet påkrævet.

## Tilføj kolonne

```sql
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL
);

ALTER TABLE suppliers
  ADD COLUMN phone TEXT;

-- Undgå fejl hvis kolonnen allerede findes
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

`DROP COLUMN` fjerner kolonnen og dens indhold, når ændringen gemmes. En nulstilling genskaber kun lektionens seed, ikke dine egne indtastede værdier; de kræver en egnet backup eller en anden bevaret kopi.

## Rækkefølge betyder noget

1. Opret forældre-tabel (`suppliers`)
2. Tilføj FK-kolonne på barn (`products.supplier_id`)
3. Tilføj `FOREIGN KEY`-constraint
4. Først derefter: indsæt data der bruger FK

Samme tænkning som ved `DELETE` og cascading — **grafen** styrer rækkefølgen.

> [!RAYMOND:idea-notes] En ændring i tre skridt
>
> Først en ny kolonne, så en begrundet udfyldning af gamle rækker, til sidst den nye regel. En vilkårlig tekst som »ukendt« gør måske `NOT NULL` tilfreds, men gør den også leverandørens telefonnummer brugbart?

## ALTER som migration

I et hold-projekt er hver `ALTER` en **versioneret ændring**:

1. Skriv SQL-scriptet og beslut, om det er en engangsmigration eller bevidst kan genkøres
2. Kør det mod en kopi / elev-DB først  
3. Dokumentér breaking changes (API DTO’er, seeds)

```sql
-- Eksempel: tilføj kolonne + backfill + NOT NULL
ALTER TABLE products ADD COLUMN IF NOT EXISTS vat_pct NUMERIC(5,2);
UPDATE products SET vat_pct = 25.00 WHERE vat_pct IS NULL;
ALTER TABLE products ALTER COLUMN vat_pct SET NOT NULL;
```

## Hvad ALTER *ikke* er god til

- At “fikse data” midt i en forvirret session uden backup/nulstil  
- At skifte PK-strategi uden plan  
- At droppe kolonner appen stadig bruger  

## Prøv selv

1. Tilføj `phone` på `suppliers`, indsæt data, sæt derefter `NOT NULL` (med backfill).  
2. Tilføj FK fra `products` til `suppliers` og bryd den bevidst med DML.  
3. Nulstil, når du er færdig.

> [!RAYMOND:reading] Gennemgå migrationen med en makker
>
> Forklar starttilstand, rækkefølge og sluttilstand for din ændring. Vis, hvilke gamle rækker der er bevaret, og hvilken ny ugyldig værdi databasen nu skal afvise.
