---
title: 6. RETURNING og API-venlig DML
slug: dml-06-returning
module: dml
order: 6
kind: theory
objectives:
  - Bruge RETURNING efter INSERT/UPDATE/DELETE
  - Hente genererede id’er uden ekstra SELECT
  - Forstå mønsteret ift. C#/API
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    INSERT INTO products (name, category, price, in_stock)
    VALUES ('Matcha', 'Drikke', 38.00, TRUE)
    RETURNING id, name, price;
---

# RETURNING og API-venlig DML

Raymonds café-API har lige oprettet et produkt. Skærmen skal nu kende **id’et på netop den række**. Med `RETURNING` kan samme ændring levere de ønskede værdier tilbage uden et separat opslag efter »det største id«.

> [!RAYMOND:question] Hvem fik det største id?
>
> To klienter indsætter næsten samtidig. Hvorfor kan `SELECT MAX(id)` bagefter finde den anden klients produkt? `RETURNING` knytter svaret til den ændring, som din egen kommando udførte.

## INSERT … RETURNING

```sql
INSERT INTO products (name, category, price, in_stock)
VALUES ('Matcha', 'Drikke', 38.00, TRUE)
RETURNING id, name, price;
```

## UPDATE … RETURNING

```sql
UPDATE products
SET price = price + 1.00
WHERE category = 'Bagværk'
RETURNING name, price;
```

> [!RAYMOND:reading] Læs rækkerne fra din ændring
>
> Ved `INSERT` og `UPDATE` ser du de nye værdier; ved `DELETE` ser du værdierne fra de fjernede rækker. Resultatets kolonner er din kontrakt til C#-koden, så vælg dem bevidst.

## DELETE … RETURNING

```sql
DELETE FROM orders
WHERE id = 14
RETURNING id, product_id, quantity;
```

Godt til at logge *hvad* der blev slettet — eller vise brugeren bekræftelse.

## Flere rækker

```sql
INSERT INTO customers (name, city, email) VALUES
  ('Gina Berg', 'Randers', 'gina@example.com'),
  ('Hans Kirk', 'Viborg', NULL)
RETURNING id, name;
```

## Bro til ADO.NET / Dapper

Raymond lader C# læse resultatkolonnerne fra `RETURNING` med en reader eller en passende Dapper-metode. Der kan komme nul, én eller flere rækker; vælg en metode, der passer til den forventede mængde.

| Undgå | Foretræk |
|-------|----------|
| `SELECT MAX(id)` efter insert | `RETURNING id` |
| Gætte id-sekvens | lade databasen returnere værdien |

> [!RAYMOND:skeptical] En kørsel uden resultatrækker
>
> Din `UPDATE ... RETURNING` kører uden fejl, men returnerer ingen rækker. Hvad kan det fortælle om dit `WHERE`? Forklar hvorfor »SQL kørte« ikke alene betyder, at det ønskede produkt blev ændret.
