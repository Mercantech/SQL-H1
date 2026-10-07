---
title: Filtrering og sortering
module: select
order: 2
kind: theory
objectives:
  - WHERE til filtrering
  - ORDER BY til sortering
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: SELECT * FROM products WHERE price > 30 ORDER BY price DESC;
---

# Filtrering og sortering

## WHERE

Filtrer rækker med `WHERE`:

```sql
SELECT * FROM products WHERE category = 'Drikke';
```

Sammenligninger: `=`, `<>`, `<`, `>`, `<=`, `>=`, `LIKE`, `IN`, `BETWEEN`.

## ORDER BY

Sorter resultatet:

```sql
SELECT name, price FROM products ORDER BY price DESC;
```

Brug `ASC` (standard) eller `DESC`. Du kan sortere på flere kolonner: `ORDER BY category, price DESC`.
