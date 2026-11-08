---
title: 7. WITH (CTE)
slug: joins-07-with
module: joins-subqueries
order: 7
kind: theory
objectives:
  - Skrive Common Table Expressions
  - Kæde flere CTE’er
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    WITH dyre AS (
      SELECT * FROM products WHERE price >= 40
    )
    SELECT name, price FROM dyre ORDER BY price DESC;
---

# WITH (CTE)

Raymond deler en lang rapport op i delspørgsmål med navne: først ordrelinjer, så beløb pr. kunde. En **CTE** (Common Table Expression) giver et deludtryk et navn inden for den samme SQL-sætning. Det opretter ikke en almindelig tabel, som bliver liggende bagefter.

> [!RAYMOND:idea-notes] Giv delspørgsmålet et meningsfuldt navn
>
> Hvad indeholder `dyre`, og hvilke kolonner kan den ydre SELECT bruge? Læs navnet som en forklaring til din makker, ikke som et nyt permanent objekt i databasen.

## Enkel CTE

```sql
WITH dyre AS (
  SELECT * FROM products WHERE price >= 40
)
SELECT name, price FROM dyre ORDER BY price DESC;
```

## Top 2 pr. kategori (vindue + CTE)

```sql
WITH ranked AS (
  SELECT name, category, price,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS nr
  FROM products
)
SELECT name, category, price
FROM ranked
WHERE nr <= 2
ORDER BY category, nr;
```

Raymond laver først et resultat med en placering pr. produkt og filtrerer derefter på `nr` i den ydre SELECT. Det beskriver beregningen tydeligt; det er ikke et løfte om en bestemt fysisk kørselsplan.

## Flere CTE’er

```sql
WITH linjer AS (
  SELECT o.customer_id, o.quantity * p.price AS beloeb
  FROM orders o
  JOIN products p ON p.id = o.product_id
),
pr_kunde AS (
  SELECT customer_id, SUM(beloeb) AS total
  FROM linjer
  GROUP BY customer_id
)
SELECT c.name, pr_kunde.total
FROM pr_kunde
JOIN customers c ON c.id = pr_kunde.customer_id
ORDER BY total DESC;
```

## WITH RECURSIVE (kort)

PostgreSQL understøtter rekursive CTE’er til hierarkier. Caféens data har ikke et træ, så Raymond holder denne lektion til almindelige CTE’er. En CTE bliver heller ikke altid gemt som et mellemresultat under udførelsen; planlæggeren kan ofte flette den ind i resten af forespørgslen.

> [!RAYMOND:question] Kan hvert trin forklares alene?
>
> Peg på outputkolonnerne fra `linjer`, så fra `pr_kunde`, og til sidst i rapporten. Hvilket trin laver beløbet, og hvilket summerer det? Hvis du kan forklare de tre roller, er navngivningen begyndt at hjælpe dig.

## Prøv selv

Lav en CTE `viborg` med kunder i Viborg, og join den med deres ordrer.

Kilde: [PostgreSQLs WITH Queries](https://www.postgresql.org/docs/16/queries-with.html).
