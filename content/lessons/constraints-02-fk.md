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

Fremmednøgler beskytter **referenceintegritet**: barnet må ikke pege på en forælder, der ikke findes — og forælderen må ikke forsvinde, mens børn stadig pejer (medmindre reglen siger andet).

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

Undgå at ændre `id`-værdier, der bruges som FK. Hvis I *skal* (sjælden migration):

- `ON UPDATE CASCADE` på FK (sættes i DDL), eller  
- opdatér børn først / brug en midlertidig mapping  

Surrogat-id’er er netop designet til at være **stabile**.

## Hvad FK *ikke* løser alene

| Problem | Løsning ud over FK |
|---------|---------------------|
| “Kunden må ikke slettes hvis … forretningsregel” | app / trigger / soft delete |
| “Antal skal være positivt” | `CHECK` |
| “E-mail unik” | `UNIQUE` |
| “Pris på linjen skal huskes” | snapshot-kolonne |

FK siger kun: *peger I på noget gyldigt?*

## Matchende indeks

Når I joiner og sletter på `orders.customer_id`, hjælper et indeks. PK/UNIQUE på forælderen findes allerede; **barn-kolonnen** bør indekseres i større systemer:

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
