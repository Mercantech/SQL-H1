---
title: 4. Flere tabeller og self-join
slug: joins-04-multi
module: joins-subqueries
order: 4
kind: theory
objectives:
  - Joine tre eller flere tabeller
  - Aggregere over joins
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.city, SUM(o.quantity * p.price) AS omsaetning
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    GROUP BY c.city
    ORDER BY omsaetning DESC;
---

# Flere tabeller og aggregering

Raymond vil følge salget hele vejen fra kunde til ordre til produkt. Ordren gemmer henvisningerne; to JOINs giver navnene og den aktuelle produktpris. Følg én ordre ad gangen, før du lægger en opsummering ovenpå.

> [!RAYMOND:foreign-key] Kan du følge de to forbindelser?
>
> Peg først på ordren, så kunden via customer_id og til sidst produktet via product_id. Hvis én forbindelse mangler et match, hvad betyder de to INNER JOINs så for ordrelinjen?

## Følg en ordre gennem kæden

Vælg en ordre og se, hvordan `customer_id` og `product_id` binder tabellerne sammen.

```join-viz
chain
```

## Omsætning pr. by

```sql
SELECT c.city, SUM(o.quantity * p.price) AS omsaetning
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
GROUP BY c.city
ORDER BY omsaetning DESC;
```

Rapporten bruger den **aktuelle** produktpris og kun ordrer med en registreret kunde. Raymond kalder derfor tallet en beregning på caféens nuværende data, ikke en revisionssikker historisk omsætning.

## Topkunder

```sql
SELECT c.name, COUNT(*) AS ordrer, SUM(o.quantity) AS stk
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.name
ORDER BY stk DESC, c.name;
```

## Samme tabel to gange? (self-join)

I café-dataen er self-join sjældent nødvendig. Mønsteret er:

```sql
SELECT a.name, b.name
FROM customers a
JOIN customers b ON a.city = b.city AND a.id < b.id;
```

Det finder par af kunder i samme by. Raymond følger de to aliaser som to pladser ved bordet: `a.id < b.id` udelukker både en kunde parret med sig selv og det samme par i omvendt rækkefølge.

> [!RAYMOND:thinking] Tæl det, rapporten spørger efter
>
> En ordrelinje med quantity 3 er én linje, men tre solgte styk. Forklar forskellen på COUNT(*) og SUM(quantity) i topkunderapporten, inden du vælger, hvem der er "topkunde".

```teach
{
  "question": "Du vil vise alle 14 ordrelinjer, også de to anonyme køb. Hvilke JOIN-typer vælger du fra orders til henholdsvis customers og products?",
  "answer": "Brug LEFT JOIN til customers, da en ordre kan mangle en kunde. INNER JOIN til products bevarer alle 14 på caféens startdata, fordi product_id er obligatorisk og henviser til en gyldig vare."
}
```

## Prøv selv

Vis kategori og samlet omsætning (`SUM(quantity * price)`) pr. `category`.

Tegn en bon, og sammenlign med [minicaféens fire bonlinjer](/forloeb/joins/lessons/0003-foelg-en-ordre.html).

Fordybelse i PostgreSQL · [Sammenkæd flere tabeller](https://www.postgresql.org/docs/16/queries-table-expressions.html).
