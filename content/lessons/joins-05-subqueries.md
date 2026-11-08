---
title: 5. Subqueries
slug: joins-05-subqueries
module: joins-subqueries
order: 5
kind: theory
objectives:
  - Bruge subquery i WHERE
  - Bruge subquery i FROM/SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT name, price
    FROM products
    WHERE price > (SELECT AVG(price) FROM products)
    ORDER BY price DESC;
---

# Subqueries

Raymond vil finde varer, der er dyrere end gennemsnittet. Først skal gennemsnittet findes; derefter kan hver pris sammenlignes med det. En **subquery** er en SELECT inde i en anden SQL-sætning, som udtrykker netop sådan et delspørgsmål.

> [!RAYMOND:thinking] Hvor mange værdier skal delspørgsmålet give?
>
> En pris kan sammenlignes med ét gennemsnit. En skalar subquery må højst returnere én række: ingen række bliver til NULL, og flere rækker giver fejl. AVG-udtrykket her giver én opsummering.

## Skalar subquery (én værdi)

Produkter dyrere end gennemsnittet:

```sql
SELECT name, price
FROM products
WHERE price > (SELECT AVG(price) FROM products)
ORDER BY price DESC;
```

## IN (liste)

Kunder der har bestilt **Espresso**:

```sql
SELECT name FROM customers
WHERE id IN (
  SELECT customer_id FROM orders
  WHERE product_id = (SELECT id FROM products WHERE name = 'Espresso')
)
ORDER BY name;
```

Opslaget på produktnavnet `Espresso` forudsætter her, at navnet finder netop ét produkt. Seedet opfylder det, men navnekolonnen har ikke en UNIQUE-regel. Raymond vil bruge et entydigt produkt-id eller en passende forespørgsel, hvis navne kan gentages i et rigtigt system.

## Subquery i FROM

```sql
SELECT category, snit
FROM (
  SELECT category, AVG(price) AS snit
  FROM products
  GROUP BY category
) t
WHERE snit > 30
ORDER BY snit DESC;
```

## Correlated subquery

Subquery der refererer til den ydre række:

```sql
SELECT c.name,
  (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS antal
FROM customers c
ORDER BY antal DESC, c.name;
```

En korreleret subquery bruger en værdi fra den ydre forespørgsel. Ofte kan den også udtrykkes med JOIN og GROUP BY. Raymond vælger en læselig formulering, kontrollerer resultatet og undersøger planen, hvis performance bliver et problem.

> [!RAYMOND:question] Hvad forbinder den indre og den ydre række?
>
> Find `o.customer_id = c.id` i kundeeksemplet. Hvad ville tællingen betyde, hvis betingelsen manglede? Brug samme tanke, når gennemsnittet skal gælde produktets egen kategori.

## Prøv selv

Vis produkter med pris under gennemsnittet for **deres egen** kategori (correlated).
