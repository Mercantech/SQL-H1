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

Raymond vil have overblik over caféen: Hvor mange varer har vi, og hvad koster de i gennemsnit? **Aggregater** opsummerer flere rækkers værdier. Beslut først, hvad én række i din færdige rapport skal repræsentere.

| Funktion | Betydning |
|----------|-----------|
| `COUNT(*)` | antal rækker |
| `COUNT(kolonne)` | antal ikke-NULL |
| `SUM(x)` | sum |
| `AVG(x)` | gennemsnit |
| `MIN(x)` / `MAX(x)` | mindste / største |

> [!RAYMOND:question] Hvad tæller vi egentlig?
>
> `COUNT(*)` tæller rækker. `COUNT(email)` tæller rækker med en oplyst e-mail. Kan de give forskellige svar på den samme kundetabel, og hvad ville forskellen betyde?

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

Raymonds arbejdsregel her: Hver valgt kolonne skal enten beskrive gruppen eller beregnes med et aggregat. I vores eksempler skriver vi gruppekolonnerne i `GROUP BY`. PostgreSQL kan også acceptere andre kolonner, når de er funktionelt afhængige af en grupperet primærnøgle; det ser vi nærmere på i databasedesign.

## HAVING — filter efter gruppering

`WHERE` filtrerer **før** gruppering. `HAVING` filtrerer **efter**:

```sql
SELECT category, COUNT(*) AS antal
FROM products
GROUP BY category
HAVING COUNT(*) >= 2;
```

> [!RAYMOND:thinking] Filtrerer du varer eller grupper?
>
> Vil jeg fjerne billige varer **før** optællingen, bruger jeg `WHERE`. Vil jeg beholde kategorier med mindst et bestemt antal varer **efter** optællingen, bruger jeg `HAVING`. Peg på, hvad hver række betyder på de to tidspunkter.

## Prøv selv

Vis antal kunder pr. by (`city`, `antal`), kun byer med mindst 2 kunder.
