---
title: Gruppering, aggregering og funktioner
module: select
order: 3
kind: theory
objectives:
  - GROUP BY
  - Aggregater COUNT, SUM, AVG, MIN, MAX
  - Almindelige funktioner
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: SELECT category, COUNT(*), AVG(price) FROM products GROUP BY category;
---

# Gruppering og aggregering

Aggregater opsummerer flere rækker:

| Funktion | Betydning |
|----------|-----------|
| `COUNT(*)` | Antal rækker |
| `SUM(x)` | Sum |
| `AVG(x)` | Gennemsnit |
| `MIN` / `MAX` | Mindste / største |

```sql
SELECT category, COUNT(*) AS antal, AVG(price) AS snitpris
FROM products
GROUP BY category;
```

## HAVING

`WHERE` filtrerer før gruppering; `HAVING` filtrerer efter:

```sql
SELECT category, COUNT(*) AS antal
FROM products
GROUP BY category
HAVING COUNT(*) >= 2;
```

## Funktioner

Eksempler: `UPPER(name)`, `LOWER(name)`, `LENGTH(name)`, `ROUND(price, 0)`, `COALESCE(city, 'Ukendt')`.
