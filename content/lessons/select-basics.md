---
title: SELECT — grundlæggende
module: select
order: 1
kind: theory
objectives:
  - Forstå SELECT og FROM
  - Vælge kolonner og alle kolonner med *
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: SELECT * FROM customers;
---

# SELECT — grundlæggende

`SELECT` henter data fra en eller flere tabeller. Den simpleste form er:

```sql
SELECT * FROM customers;
```

`*` betyder “alle kolonner”. Du kan også vælge specifikke kolonner:

```sql
SELECT name, city FROM customers;
```

## Tip

Kør først `SELECT *` for at se strukturen, og begræns derefter kolonnerne. I SQL-H1 har du din egen Postgres-database — brug **Playground** eller opgaverne til at øve dig.
