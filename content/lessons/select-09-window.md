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

Caféen overvejer et tilbud på Espresso til samme pris som Te. De fem rækker herunder findes kun i forespørgslen. Menukortets gemte priser påvirkes ikke.

```teach
{
  "question": "På kampagnelisten koster Espresso og Te begge 25. To varer er billigere, og Latte er den næste dyrere. Hvilke rangtal får Espresso, Te og Latte med RANK og DENSE_RANK, når billigste pris står først?",
  "answer": "Med RANK får de 3, 3 og 5. Med DENSE_RANK får de 3, 3 og 4. Espresso og Te deler tredjepladsen. RANK tæller de to rækker med, når næste placering beregnes."
}
```

```sql
WITH tilbud(vare, pris) AS (
  VALUES ('Chokoladebolle', 18.00), ('Croissant', 22.50),
         ('Espresso', 25.00), ('Te', 25.00), ('Latte', 35.00)
)
SELECT vare, pris,
       RANK() OVER (ORDER BY pris) AS rang,
       DENSE_RANK() OVER (ORDER BY pris) AS taet_rang
FROM tilbud
ORDER BY pris, vare;
```

SQL'en sorterer på pris, når den beregner rang. Den yderste sortering på pris og varenavn bestemmer kun visningen. Prøv bagefter [kampagnen på alle otte varer](/learn/select-ex-05).

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

Fordybelse i PostgreSQL · [Vinduesfunktioner i PostgreSQL](https://www.postgresql.org/docs/16/tutorial-window.html).
