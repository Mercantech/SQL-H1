---
title: 3. LEFT, RIGHT og FULL JOIN
slug: joins-03-outer
module: joins-subqueries
order: 3
kind: theory
objectives:
  - Bruge LEFT JOIN til “alle fra venstre”
  - Forstå NULL i join-resultater
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT p.name, COUNT(o.id) AS antal_ordrer
    FROM products p
    LEFT JOIN orders o ON o.product_id = p.id
    GROUP BY p.name
    ORDER BY antal_ordrer, p.name;
---

# LEFT, RIGHT og FULL JOIN

## LEFT JOIN

Alle rækker fra **venstre** tabel, plus match fra højre. Mangler match → `NULL`.

Find produkter **uden** ordrer:

```sql
SELECT p.name
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
WHERE o.id IS NULL;
```

Antal ordrer pr. produkt (inkl. 0):

```sql
SELECT p.name, COUNT(o.id) AS antal_ordrer
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
GROUP BY p.name
ORDER BY antal_ordrer, p.name;
```

Bemærk: `COUNT(o.id)` tæller ikke `NULL`-rækker — derfor bliver det 0 for produkter uden ordrer.

## RIGHT JOIN

Spejlvendt `LEFT JOIN` (alle fra højre). Mindre brugt — de fleste skriver om til `LEFT JOIN`.

## FULL OUTER JOIN

Alle fra begge sider. Sjældent i hverdagen, men nyttigt at kende.

## Prøv selv

List kunder der **ikke** har nogen ordre (`LEFT JOIN` + `WHERE o.id IS NULL`).
