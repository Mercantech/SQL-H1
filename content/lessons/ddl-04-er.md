---
title: 4. E/R — dokumentér dit skema
slug: ddl-04-er
module: ddl-er
order: 4
kind: theory
objectives:
  - Dokumentere entiteter og relationer
  - Koble E/R til CREATE TABLE / FK
  - Bruge Database-siden som levende diagram
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    SELECT
      tc.table_name AS barn,
      kcu.column_name AS fk_kolonne,
      ccu.table_name AS foraelder
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
---

# E/R — dokumentér dit skema

Raymond skal forklare caféens database til en ny kollega. I stedet for at læse alle `CREATE TABLE`-sætninger højt tegner han et **E/R-diagram**: hvilke entiteter der findes, og hvordan nøgler forbinder dem. Nu skal tegningen og den faktiske database fortælle samme historie.

> [!RAYMOND:foreign-key] Hvor hører walk-in-kunden til?
>
> En ordre kan være uden navngiven kunde, men skal have et produkt. Hvordan vil du vise forskellen på **valgfri** og **påkrævet** reference? Brug både diagrammet og kolonnernes nullability i din forklaring.

## Caféen som E/R

```text
customers (1) ──< (n) orders (n) >── (1) products
```

| Entitet | Tabel | Nøgle |
|---------|-------|-------|
| Kunde | `customers` | `id` PK |
| Produkt | `products` | `id` PK |
| Ordre | `orders` | `id` PK, FK til begge |

Kardinalitet i undervisningsmodellen: én kunde kan have nul eller flere ordrer; én ordre peger på præcis ét produkt. Walk-in betyder, at `orders.customer_id` må være `NULL`, så ordren kan være uden en kundereference.

## Fra E/R til DDL

1. Tegn entiteter (kasser)
2. Find 1:n / n:n (streger)
3. n:n → koblingstabel
4. Skriv `CREATE TABLE` med PK
5. Tilføj `REFERENCES` (FK)
6. Tilføj `UNIQUE` / `CHECK` hvor forretningen kræver det

Det er samme historie som i *Relationstyper og database-design* — nu ejer du knapperne (`CREATE`/`ALTER`).

## Levende dokumentation i SQL-H1

Gå til **Database** i menuen: der ser du tabeller, kolonner og relationer fra **din** database (inkl. tabeller du selv opretter).

Metadata med SQL:

```sql
SELECT
  tc.table_name AS barn,
  kcu.column_name AS fk_kolonne,
  ccu.table_name AS foraelder
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY barn, fk_kolonne;
```

> [!RAYMOND:reading] Tegningen skal kunne efterprøves
>
> Find én forbindelse i dit diagram, og peg på den FK, der håndhæver den. Metadataforespørgslen her er en enkel oversigt til caféens navngivne, enkolonne-relationer; komplekse sammensatte nøgler kræver en mere detaljeret sammenkobling.

## Mini-designøvelse (café-udvidelse)

Tegn (på papir eller i tekst) og implementér gerne:

```text
suppliers (1) ──< (n) products
categories (1) ──< (n) products   -- lookup i stedet for fri tekst
```

Krav:
- `suppliers(id, name, city)`
- `categories(id, name)` med `UNIQUE(name)`
- `products` får `supplier_id` og/eller `category_id` (FK)

Når det virker, lader Raymond dig sammenligne din håndtegnede model, `CREATE TABLE`/`ALTER TABLE` og **Database**-oversigten. En uenighed mellem dem er et konkret sted at undersøge.

## Hvorfor det betyder noget i projektet

I H1-projektet skal I kunne:
- forklare skemaet til hinanden og underviseren
- ændre struktur uden at “gætte” i blinde
- pege på hvor applikationen (C#/API) mapper til tabeller

## E/R-checkliste før I koder API

1. Er hver entitet en tabel (eller bevidst sammenslået)?  
2. Ligger FK på “mange”-siden?  
3. Er n:n brudt med koblingstabel?  
4. Er naturlige unikheder markeret (`UNIQUE`)?  
5. Matcher diagrammet det, `information_schema` viser?

## Crow’s foot (kort)

```text
||───<   én-til-mange (obligatorisk på mange-siden kan variere)
|O───<   valgfri på én-siden
```

I behøver ikke tegne perfekt UML — men pil/kardinalitet skal være entydig.

## Prøv selv

1. Tegn caféen med kardinalitet.  
2. Udvid med `suppliers` og opdatér **Database**-siden.  
3. Kør FK-metadata-forespørgslen og match den til tegningen.

> [!RAYMOND:idea-notes] Lad en anden læse modellen
>
> Giv en makker dit diagram uden at forklare det først. Kan de finde primærnøglen, mange-siden og en valgfri reference? Ret de steder, hvor tegningen kræver, at læseren gætter.
