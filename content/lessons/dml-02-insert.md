---
title: 2. INSERT i dybden
slug: dml-02-insert
module: dml
order: 2
kind: theory
objectives:
  - Indsætte én eller flere rækker
  - Bruge DEFAULT og INSERT … SELECT
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    INSERT INTO products (name, category, price, in_stock)
    VALUES ('Iste', 'Drikke', 29.00, TRUE);
---

# INSERT i dybden

## Én række

```sql
INSERT INTO products (name, category, price, in_stock)
VALUES ('Iste', 'Drikke', 29.00, TRUE);
```

Kolonner du **ikke** nævner, får `DEFAULT` (fx `id` via `SERIAL`, `created_at` på kunder).

## Flere rækker ad gangen

```sql
INSERT INTO customers (name, city, email) VALUES
  ('Gustav Berg', 'Odense', 'gustav@example.com'),
  ('Helle Dam', 'Aalborg', NULL);
```

## INSERT … SELECT

Kopiér eller transformér data fra en forespørgsel:

```sql
INSERT INTO products (name, category, price, in_stock)
SELECT name || ' (kopi)', category, price, FALSE
FROM products
WHERE name = 'Te';
```

## RETURNING

Få den indsatte række tilbage med det samme (stadig tilladt — det er en del af `INSERT`):

```sql
INSERT INTO products (name, category, price)
VALUES ('Kaffe to go', 'Drikke', 30.00)
RETURNING id, name, price;
```

## Prøv selv

Indsæt produktet **`Sockerkaka`** i kategorien **`Bagværk`** til **`24.00`**.
