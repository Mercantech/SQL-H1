---
title: 6. EXISTS og NOT EXISTS
slug: joins-06-exists
module: joins-subqueries
order: 6
kind: theory
objectives:
  - Bruge EXISTS til “findes mindst én”
  - Vælge mellem IN og EXISTS
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT name FROM customers c
    WHERE EXISTS (
      SELECT 1 FROM orders o WHERE o.customer_id = c.id
    )
    ORDER BY name;
---

# EXISTS og NOT EXISTS

Raymond spørger: Har kunden mindst én ordre? Han behøver hverken alle ordrelinjer eller et bestemt produktnavn for at svare. `EXISTS` er sand, hvis delspørgsmålet finder **mindst én** række.

> [!RAYMOND:curious] En kunde eller alle kundens ordrer?
>
> Hvis Anna har flere ordrer, hvor mange gange skal hun stå i en liste over kunder med mindst én ordre? EXISTS undersøger, om et match findes, uden at oprette en resultatrække for hvert match.

## Kunder med ordrer

```sql
SELECT name FROM customers c
WHERE EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY name;
```

## Kunder uden ordrer

```sql
SELECT name FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY name;
```

I caféens udgangspunkt har **Clara Holm ingen ordrer**, så hun kan bruges til at kontrollere NOT EXISTS. Raymond vil først undersøge de eksisterende data; du behøver ikke slette noget for at skabe et eksempel.

## EXISTS vs IN

- `IN` spørger, om en værdi er blandt delspørgsmålets værdier.
- `EXISTS` spørger, om delspørgsmålet returnerer en række. `SELECT 1` er en konvention; tallet tælles ikke.
- Vælg efter betydning og læsbarhed. Databasen kan optimere begge former; EXISTS er ikke automatisk hurtigst. Vær især opmærksom på NULL ved `NOT IN`.

## Produkter bestilt af Viborg-kunder

```sql
SELECT DISTINCT p.name
FROM products p
WHERE EXISTS (
  SELECT 1
  FROM orders o
  JOIN customers c ON c.id = o.customer_id
  WHERE o.product_id = p.id AND c.city = 'Viborg'
)
ORDER BY p.name;
```

> [!RAYMOND:question] Hvilket match undersøger vi?
>
> I produktforespørgslen står både produkt-id og kundens by inde i delspørgsmålet. Forklar, hvorfor et køb fra en kunde i en anden by ikke er nok til, at den ydre produktrække bliver valgt.

## Prøv selv

List kategorier hvor der **findes** mindst ét udsolgt produkt (`NOT in_stock`).

Kilde: [PostgreSQLs Subquery Expressions](https://www.postgresql.org/docs/16/functions-subquery.html).
