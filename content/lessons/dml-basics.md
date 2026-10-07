---
title: INSERT, UPDATE og DELETE
module: dml
order: 1
kind: theory
objectives:
  - INSERT nye rækker
  - UPDATE eksisterende data
  - DELETE rækker sikkert
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: INSERT INTO products (name, category, price) VALUES ('Smoothie', 'Drikke', 42.00);
---

# INSERT, UPDATE og DELETE

## INSERT

```sql
INSERT INTO products (name, category, price)
VALUES ('Smoothie', 'Drikke', 42.00);
```

## UPDATE

Husk altid `WHERE` — ellers opdateres alle rækker:

```sql
UPDATE products SET price = 30.00 WHERE name = 'Espresso';
```

## DELETE

```sql
DELETE FROM orders WHERE id = 1;
```

Fremmednøgler kan forhindre sletning, hvis der stadig findes afhængige rækker. Brug **Nulstil data** i opgaver, hvis du vil starte forfra.
