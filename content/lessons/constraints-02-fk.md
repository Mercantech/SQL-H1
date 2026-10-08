---
title: 2. Fremmednøgler under DML
slug: constraints-02-fk
module: constraints
order: 2
kind: theory
objectives:
  - Slette i den rigtige rækkefølge
  - Forstå fejlbeskeder fra Postgres
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    DELETE FROM customers WHERE name = 'Bo Nielsen';
---

# Fremmednøgler under DML

## Sletning i forkert rækkefølge

```sql
DELETE FROM customers WHERE name = 'Bo Nielsen';
```

Postgres svarer typisk med en fejl om **foreign key / restrict**. Bo har ordrer.

## Korrekt rækkefølge

```sql
DELETE FROM orders
WHERE customer_id = (SELECT id FROM customers WHERE name = 'Bo Nielsen');

DELETE FROM customers WHERE name = 'Bo Nielsen';
```

## Opdatering af nøgler

Undgå at ændre `id`-værdier, der bruges som FK — medmindre du har en bevidst migrationsplan (`ON UPDATE CASCADE` findes i DDL, som ligger uden for MVP).

## Øvelse

1. Prøv at slette **Espresso** uden at røre ordrer — se fejlen.  
2. Nulstil data.  
3. Slet Espresso-ordrer, derefter produktet.  
4. Nulstil igen, når du er færdig.
