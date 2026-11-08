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

Raymond vil også se dem, der ikke har købt noget. Nu er et manglende match en vigtig oplysning, som rapporten skal bevare. Vi vælger JOIN-type efter spørgsmålet.

## LEFT JOIN

Alle rækker fra **venstre** tabel, plus match fra højre. Mangler match → `NULL`.

Skift mellem join-typerne, og prøv fanen **Produkter ⋈ Ordrer**. I diagrammets lille demonstrationsdatasæt har Croissant ingen ordrer. I SQL-editorens café-seed har Croissant derimod ordrer; dér er Chokoladebolle usolgt i udgangspunktet. Diagram og sandbox bruger forskellige datasæt.

```join-viz
types
```

> [!RAYMOND:question] Hvor bliver nullet af?
>
> LEFT JOIN bevarer produktet uden match, men højresidens ordrefelter bliver NULL. Vil COUNT(*) og COUNT(o.id) derfor tælle det samme? Følg en usolgt vare gennem de to trin.

## Find produkter uden ordrer

```sql
SELECT p.name
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
WHERE o.id IS NULL;
```

## Antal ordrer pr. produkt (inkl. 0)

```sql
SELECT p.name, COUNT(o.id) AS antal_ordrer
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
GROUP BY p.name
ORDER BY antal_ordrer, p.name;
```

Raymond tæller `o.id`, fordi COUNT af en kolonne ignorerer NULL-værdier. Det giver 0 for et produkt uden ordrer. COUNT(*) ville også tælle den bevarede resultatrække og derfor give 1.

## RIGHT JOIN

Spejlvendt `LEFT JOIN` (alle fra højre). Mindre brugt — de fleste skriver om til `LEFT JOIN`.

## FULL OUTER JOIN

Alle fra begge sider. I café-dataen: Clara (ingen ordrer) **og** walk-in-ordrer (`customer_id` er `NULL`). Se **FULL** i diagrammet — alle tre zoner får hit.

```sql
SELECT c.name, o.id AS ordre_id
FROM customers c
FULL OUTER JOIN orders o ON o.customer_id = c.id
ORDER BY c.name NULLS LAST, o.id;
```

> [!RAYMOND:skeptical] Et filter kan fjerne det, du ville bevare
>
> Et WHERE-krav til højresidens ordrefelter kan fjerne de NULL-udfyldte rækker fra et LEFT JOIN. Spørg derfor: Skal kravet afgøre, hvilke ordrer der kan matche i ON, eller hvilke færdige resultatrækker der beholdes i WHERE?

## Prøv selv

List kunder der **ikke** har nogen ordre (`LEFT JOIN` + `WHERE o.id IS NULL`).
