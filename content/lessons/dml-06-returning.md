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

Når en API opretter en række, skal klienten ofte have det nye **`id`** tilbage. I stedet for `INSERT` + `SELECT MAX(id)` (race condition!) bruger du **`RETURNING`**.

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

I C# kører du samme SQL og læser resultatsættet fra `RETURNING` — præcis som en `SELECT`. Det er standardmønsteret i jeres H1-API’er.

| Undgå | Foretræk |
|-------|----------|
| `SELECT MAX(id)` efter insert | `RETURNING id` |
| Gætte id-sekvens | lade databasen returnere værdien |
