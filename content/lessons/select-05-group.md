---
title: 5. Gruppering og aggregering
slug: select-05-group
module: select
order: 5
kind: theory
objectives:
  - Bruge COUNT, SUM, AVG, MIN, MAX
  - Gruppere med GROUP BY
  - Filtrere grupper med HAVING
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: "SELECT category, COUNT(*) AS antal, AVG(price) AS snitpris FROM products GROUP BY category;"
---

# Gruppering og aggregering

Aggregater opsummerer flere rækker til én værdi.

| Funktion | Betydning |
|----------|-----------|
| `COUNT(*)` | antal rækker |
| `COUNT(kolonne)` | antal ikke-NULL |
| `SUM(x)` | sum |
| `AVG(x)` | gennemsnit |
| `MIN(x)` / `MAX(x)` | mindste / største |

## Uden GROUP BY

```sql
SELECT COUNT(*) AS antal_produkter FROM products;
SELECT AVG(price) AS snitpris FROM products;
SELECT MAX(price) AS dyreste FROM products;
```

## GROUP BY

Én række pr. gruppe:

```sql
SELECT category, COUNT(*) AS antal
FROM products
GROUP BY category;

SELECT customer_id, COUNT(*) AS antal_ordrer, SUM(quantity) AS stk
FROM orders
GROUP BY customer_id
ORDER BY customer_id;
```

Regel: kolonner i `SELECT` skal enten være i `GROUP BY` eller inde i en aggregat-funktion.

## HAVING — filter efter gruppering

`WHERE` filtrerer **før** gruppering. `HAVING` filtrerer **efter**:

```sql
SELECT category, COUNT(*) AS antal
FROM products
GROUP BY category
HAVING COUNT(*) >= 2;
```

## Prøv selv

Vis antal kunder pr. by (`city`, `antal`), kun byer med mindst 2 kunder.
