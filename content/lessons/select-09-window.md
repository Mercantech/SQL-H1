---
title: 9. Vinduesfunktioner
slug: select-09-window
module: select
order: 9
kind: theory
objectives:
  - Bruge ROW_NUMBER og RANK
  - Forstå OVER (PARTITION BY …)
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT name, category, price,
      ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS nr
    FROM products
    ORDER BY category, nr;
---

# Vinduesfunktioner

Aggregater med `GROUP BY` **slår rækker sammen**. Vinduesfunktioner beholder alle rækker og tilføjer en beregnet kolonne.

## ROW_NUMBER

Nummerér produkter inden for hver kategori (dyreste først):

```sql
SELECT name, category, price,
  ROW_NUMBER() OVER (
    PARTITION BY category
    ORDER BY price DESC
  ) AS nr
FROM products
ORDER BY category, nr;
```

- `PARTITION BY` = “grupper” til nummerering  
- `ORDER BY` inde i `OVER` = rækkefølge **inden for** partitionen

## RANK og DENSE_RANK

```sql
SELECT name, price,
  RANK() OVER (ORDER BY price DESC) AS rang,
  DENSE_RANK() OVER (ORDER BY price DESC) AS taet_rang
FROM products
ORDER BY price DESC;
```

`RANK` springer over ved lighed; `DENSE_RANK` gør ikke.

## Løbende sum

```sql
SELECT order_date, quantity,
  SUM(quantity) OVER (ORDER BY order_date, id) AS loebende_stk
FROM orders
ORDER BY order_date, id;
```

## Tip

Vinduesfunktioner er stadig **kun SELECT** — perfekt til rangerede lister uden at miste detaljer.

## Prøv selv

Vis de 2 dyreste produkter **i hver kategori** (hint: brug `ROW_NUMBER` i en ydre filtrering — eller se WITH-lektionen i JOIN-modulet).
