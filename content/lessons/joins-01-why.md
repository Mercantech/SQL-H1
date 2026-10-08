---
title: 1. Hvorfor JOIN?
slug: joins-01-why
module: joins-subqueries
order: 1
kind: theory
objectives:
  - Forstå relationer mellem tabeller
  - Se problemet uden JOIN
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT * FROM orders LIMIT 5;
---

# Hvorfor JOIN?

Café-databasen er **normaliseret**: ordrer gemmer `customer_id` og `product_id` — ikke kundens navn eller produktets pris.

```sql
SELECT * FROM orders LIMIT 5;
```

Du ser tal, ikke “Anna købte Espresso”.

## Den dårlige idé: mange SELECT

```sql
SELECT name FROM customers WHERE id = 1;
SELECT name FROM products WHERE id = 1;
```

Det skalerer ikke. I stedet **kobler** du tabellerne i én forespørgsel med `JOIN`.

## Se nøglerne i aktion

Klik rundt i diagrammet: hver streg er et match på `customer_id`. Clara har ingen ordrer — det bliver vigtigt ved LEFT JOIN.

```join-viz
match
```

## Nøglerne

| Tabel | Primærnøgle | Fremmednøgle |
|-------|-------------|--------------|
| `customers` | `id` | — |
| `products` | `id` | — |
| `orders` | `id` | `customer_id` → customers, `product_id` → products |

Næste lektion: `INNER JOIN` — kun de rækker, hvor nøglerne matcher.
