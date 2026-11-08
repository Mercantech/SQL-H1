---
title: 8. Anti-join — “find dem uden …”
slug: joins-08-anti
module: joins-subqueries
order: 8
kind: theory
objectives:
  - Finde rækker uden match (anti-join)
  - Vælge mellem NOT EXISTS og LEFT JOIN … IS NULL
  - Anvende mønsteret på café-data
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.name, c.city
    FROM customers c
    WHERE NOT EXISTS (
      SELECT 1 FROM orders o WHERE o.customer_id = c.id
    )
    ORDER BY c.name;
---

# Anti-join — “find dem uden …”

Raymond leder efter fravær: Hvilke kunder har endnu ingen ordrer? En **anti-join** beholder rækker fra den ene side, hvor der **ikke** findes et relevant match på den anden. Det samme spørgsmål kan stilles om usolgte varer eller tickets uden kommentarer.

> [!RAYMOND:curious] Hvad ville et match være?
>
> Skriv først den positive regel: En ordre matcher kunden, når ordre.customer_id er kundens id. NOT EXISTS beholder kunden, hvis den søgning ikke finder én eneste række.

## NOT EXISTS (anbefalet)

```sql
SELECT c.name, c.city
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
)
ORDER BY c.name;
```

I seed’en: **Clara Holm** (ingen ordrer).

## LEFT JOIN … IS NULL

```sql
SELECT c.name, c.city
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL
ORDER BY c.name;
```

Samme idé: Bevar kunderne med LEFT JOIN, og behold derefter dem, hvor ordrenøglen er NULL. Raymond undersøger en kolonne, der ikke selv kan være NULL på en rigtig ordrerække, så testen faktisk betyder "intet match".

## Produkter aldrig solgt

```sql
SELECT p.name, p.category
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.product_id = p.id
)
ORDER BY p.name;
```

## NOT IN og NULL — pas på

```sql
-- Farligt hvis subquery kan indeholde NULL
SELECT * FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);
```

Når listen indeholder en NULL-værdi, giver NOT IN **ukendt** for værdier, som ikke matcher et kendt element. WHERE beholder ikke ukendt, så også kunden uden ordrer kan forsvinde. Det er en bestemt NULL-regel, ikke tilfældig opførsel. Brug NOT EXISTS til dette spørgsmål.

> [!RAYMOND:skeptical] Uden salg hvornår?
>
> "Aldrig købt" og "ikke købt i april" er forskellige spørgsmål. I det sidste tilfælde skal den indre søgning kun lede efter ordrer i den valgte periode. Forklar, hvor tidskravet skal stå, før du skriver mere SQL.

## Hvornår bruger I det i projektet?

- “Brugere uden ordrer” / “åbne tickets uden kommentarer”
- Oprydning: “lookup-værdier der ikke bruges”
- Rapporter: “produkter uden salg i perioden”
