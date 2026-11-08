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

Raymond vil rangere varerne inden for hver kategori og stadig kunne se hvert produkt. `GROUP BY` samler rækker til grupper. **Vinduesfunktioner** beregner på tværs af de valgte rækker uden at slå dem sammen.

> [!RAYMOND:thinking] Hvor mange rækker forventer du?
>
> Vi har otte produkter i caféens udgangspunkt. Skal en nummerering inden for kategorier give otte produktrækker eller én række pr. kategori? Dit svar afgør, om du tænker i vinduer eller gruppering.

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

Ved samme sorteringsværdi giver begge samme rang. For priser med én delt førsteplads kan `RANK` give `1, 1, 3`, mens `DENSE_RANK` giver `1, 1, 2`. `ROW_NUMBER` giver derimod hver række sit eget nummer; ved lige priser kræves et ekstra sorteringskriterium, hvis valget skal være entydigt.

## Løbende sum

```sql
SELECT order_date, quantity,
  SUM(quantity) OVER (ORDER BY order_date, id) AS loebende_stk
FROM orders
ORDER BY order_date, id;
```

## Tip

Vinduesfunktionerne her beregner rapportværdier uden at ændre tabellens data. Sorteringen inde i `OVER` styrer beregningen; den afsluttende `ORDER BY` styrer, hvordan hele resultatet vises.

> [!RAYMOND:question] Hvorfor skal filteret ligge udenom?
>
> Jeg skal først have en beregnet placering at filtrere på. Derfor laver vi nummereringen i en underforespørgsel eller CTE og vælger de ønskede placeringer i den ydre SELECT. Forklar, hvorfor almindelig LIMIT 2 ikke giver to varer i hver kategori.

## Prøv selv

Vis de 2 dyreste produkter **i hver kategori** (hint: brug `ROW_NUMBER` i en ydre filtrering — eller se WITH-lektionen i JOIN-modulet).
