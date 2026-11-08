---
title: 4. Sortering med ORDER BY
slug: select-04-order
module: select
order: 4
kind: theory
objectives:
  - Sortere med ORDER BY
  - Bruge ASC, DESC og LIMIT
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: SELECT name, price FROM products ORDER BY price DESC;
---

# Sortering med ORDER BY

Raymond vil vise de dyreste varer øverst på en rapport. Han stoler ikke på, at tabellen tilfældigvis kommer tilbage i den ønskede rækkefølge. Uden `ORDER BY` er rækkefølgen ikke garanteret, så vi bestiller den eksplicit:

```sql
-- Billigste først (ASC er standard)
SELECT name, price
FROM products
ORDER BY price ASC;
```

```sql
-- Dyreste først
SELECT name, price
FROM products
ORDER BY price DESC;
```

## Flere sorteringsnøgler

```sql
SELECT name, category, price
FROM products
ORDER BY category ASC, price DESC;
```

Først sorteres på kategori, derefter på pris inden for samme kategori. Rækkerne bliver ikke slået sammen som ved `GROUP BY`. Ved ens sorteringsværdier kan du tilføje en entydig nøgle som sidste kriterium, hvis rækkefølgen skal være helt bestemt.

> [!RAYMOND:sort] Hvad vil første række fortælle?
>
> I `ORDER BY category ASC, price DESC` er det kategorien, der bestemmer først. Den dyreste vare i hele caféen behøver derfor ikke stå øverst. Forklar rækkefølgen, før du ser resultatet.

## LIMIT

Vis kun de første N rækker (efter sortering):

```sql
SELECT name, price
FROM products
ORDER BY price DESC
LIMIT 3;
```

## Kombiner med WHERE

```sql
SELECT name, price
FROM products
WHERE category = 'Drikke'
ORDER BY price DESC;
```

> [!RAYMOND:skeptical] Tre tilfældige er ikke de tre dyreste
>
> Hvis jeg skriver `LIMIT 3` uden en sortering, har jeg kun begrænset antal rækker. Hvilken del af forespørgslen gør dem til de dyreste, og hvordan kan du kontrollere det i resultatet?

## Prøv selv

Vis de 2 dyreste produkter i kategorien `Bagværk`.
