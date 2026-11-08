---
title: 2. Fremmednøgler under DML
slug: constraints-02-fk
module: constraints
order: 2
kind: theory
objectives:
  - Slette i den rigtige rækkefølge
  - Forstå FK-fejlbeskeder fra Postgres
  - Kende ON DELETE / ON UPDATE på begrebsniveau
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    DELETE FROM customers WHERE name = 'Bo Nielsen';
---

# Fremmednøgler under DML

Raymond forsøger at slette Bo fra kundelisten, men caféen skal stadig kunne forklare Bos ordrer. Fremmednøglen beskytter **referenceintegriteten**: en ikke-NULL reference skal pege på en gyldig række, og sletning eller nøgleændring skal følge relationens aftalte regler.

> [!RAYMOND:foreign-key] Hvilken tabel har brug for Bo?
>
> Før du kører sletningen: find tabellen med `customer_id`, og undersøg dens rækker for Bo. En FK-fejl fortæller, at en reference skal håndteres; den vælger ikke caféens slettestrategi for dig.

## Sletning i forkert rækkefølge

```sql
DELETE FROM customers WHERE name = 'Bo Nielsen';
```

Postgres svarer typisk med **foreign key / restrict**: Bo har ordrer. Det er *godt* — historikken beskyttes.

Læs fejlteksten: den nævner ofte constraint-navn og tabeller (`orders_customer_id_fkey` el.lign.).

## Korrekt rækkefølge (manuel kaskade)

```sql
-- 1) Preview
SELECT id, product_id, quantity
FROM orders
WHERE customer_id = (SELECT id FROM customers WHERE name = 'Bo Nielsen');

-- 2) Slet børn
DELETE FROM orders
WHERE customer_id = (SELECT id FROM customers WHERE name = 'Bo Nielsen');

-- 3) Slet forælder
DELETE FROM customers WHERE name = 'Bo Nielsen';
```

I produktion vælger I ofte **soft delete** eller `ON DELETE`-strategi i stedet for blind fysisk sletning — se DML-cascading-lektionen.

## Opdatering af nøgler

Raymond beholder surrogat-id’er stabile. En nøgleændring med eksisterende referencer kræver en planlagt migration: eksempelvis `ON UPDATE CASCADE` eller passende udskudte constraints inden for én transaktion. »Opdatér børn først« virker ikke alene med en almindelig umiddelbar FK, hvis den nye forældrenøgle endnu ikke findes.

## Hvad FK *ikke* løser alene

| Problem | Løsning ud over FK |
|---------|---------------------|
| “Kunden må ikke slettes hvis … forretningsregel” | app / trigger / soft delete |
| “Antal skal være positivt” | `CHECK` |
| “E-mail unik” | `UNIQUE` |
| “Pris på linjen skal huskes” | snapshot-kolonne |

FK siger kun: *peger I på noget gyldigt?*

> [!RAYMOND:question] Gyldig er ikke det samme som obligatorisk
>
> Hvis vi gør `customer_id` til `NULL`, bevarer vi ordren uden en kundereference. Hvis vi sletter ordren, fjerner vi historikken. Begge kan være teknisk lovlige; hvilken handling passer til caféens krav?

## Matchende indeks

Et indeks på `orders.customer_id` kan hjælpe opslag og kontrol ved sletning af kunder. Forælderens PK/UNIQUE har allerede et understøttende indeks; et indeks på **barn-kolonnen** skal I vurdere særskilt ud fra arbejdsbelastningen:

```sql
-- I DDL-modulet / jeres projekt:
-- CREATE INDEX ix_orders_customer ON orders (customer_id);
```

## Diagram i hovedet

```text
customers  ←──  orders  ──→  products
   PK           FK, FK           PK
```

Slet **fra bladene ind mod roden**, medmindre CASCADE er bevidst valgt.

## Prøv selv

1. Prøv at slette **Espresso** uden at røre ordrer — se fejlen.  
2. Nulstil data.  
3. Slet Espresso-ordrer, derefter produktet.  
4. Nulstil igen, når du er færdig.  
5. (Valgfrit) Prøv `UPDATE customers SET id = 999 WHERE name = 'Anna Jensen'` — forstå hvorfor det er farligt.

> [!RAYMOND:idea-notes] Fortæl historien bag fejlen
>
> Læs én FK-fejl højt for en makker. Udpeg barnet, forælderen og den reference, der ville blive ugyldig. Foreslå derefter en handling, der både overholder databasen og bevarer den historik, caféen har brug for.
