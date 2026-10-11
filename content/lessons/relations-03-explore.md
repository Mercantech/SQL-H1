---
title: 3. Udforsk relationerne
slug: relations-03-explore
module: relations
order: 3
kind: theory
objectives:
  - Udlede relationer via forespørgsler
  - Skelne COUNT, COUNT DISTINCT og LEFT JOIN-fælder
  - Tænke i nøgler på tværs af tabeller
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT p.name, COUNT(DISTINCT o.customer_id) AS antal_kunder
    FROM products p
    LEFT JOIN orders o ON o.product_id = p.id
    GROUP BY p.name
    ORDER BY antal_kunder DESC, p.name;
---

# Udforsk relationerne

Når skemaet er på plads, **beviser** du forståelsen med forespørgsler: “Hvem hænger sammen med hvem — og hvordan tæller jeg det rigtigt?”

## Hvor populært er hvert produkt?

`COUNT(DISTINCT o.customer_id)` tæller **unikke kunder**, ikke antal linjer. Walk-in (`customer_id NULL`) tæller ikke med i `COUNT(DISTINCT …)` — `NULL` ignoreres.

```sql
SELECT p.name, COUNT(DISTINCT o.customer_id) AS antal_kunder
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
GROUP BY p.name
ORDER BY antal_kunder DESC, p.name;
```

Sammenlign med antal **linjer**:

```sql
SELECT p.name, COUNT(o.id) AS antal_linjer
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
GROUP BY p.name
ORDER BY antal_linjer DESC, p.name;
```

| Måltal | Betydning |
|--------|-----------|
| `COUNT(o.id)` | hvor mange gange produktet er solgt (linjer) |
| `COUNT(DISTINCT customer_id)` | hvor mange *forskellige* kunder (ekskl. walk-in) |

## Hvilke kunder deler by — og er begge “rigtige” kunder?

Self-join på samme tabel: parvis uden at spejle dobbelt (`a.id < b.id`).

```sql
SELECT a.name AS kunde_a, b.name AS kunde_b, a.city
FROM customers a
JOIN customers b ON a.city = b.city AND a.id < b.id
ORDER BY a.city, kunde_a;
```

Det er **ikke** en FK-relation — det er en ad hoc-relation på attributten `city`. I et mere normaliseret design kunne `city` være FK til `cities`.

## “Hvem har købt det samme som Anna?”

```sql
SELECT DISTINCT c.name
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.product_id IN (
  SELECT product_id FROM orders
  WHERE customer_id = (SELECT id FROM customers WHERE name = 'Anna Jensen')
)
AND c.name <> 'Anna Jensen'
ORDER BY c.name;
```

Her kæder du: kunde → ordrer → produkt-id’er → andre kunder. Det er **nøgle-tænkning** i flere hop.

## Grafen i caféen (husk den)

```text
customers <-- orders --> products
   (1)         (n)         (1)
```

Alt interessant i denne lektion er en sti i den graf.

## Fælder du skal kende

1. **INNER JOIN dropper** kunder uden ordrer — brug `LEFT JOIN` når “0” er et svar.  
2. **`COUNT(*)` efter JOIN** kan blæse op, hvis der er flere linjer — vær præcis med `DISTINCT`.  
3. **Walk-in** mangler i `customers`-siden af verden — tjek altid om `NULL`-FK skal med.

```sql
-- Ordrer pr. by (walk-in har ingen by)
SELECT COALESCE(c.city, '(walk-in)') AS bynavn, COUNT(*) AS ordrer
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
GROUP BY COALESCE(c.city, '(walk-in)')
ORDER BY ordrer DESC;
```

## Prøv selv

1. Find produkter med **0** unikke kunder — men gerne med linjer (hint: walk-in + usolgt).  
2. Find kunder der kun har købt **ét** distinct produkt.  
3. Forklar forskellen på de to `COUNT`-varianter øverst med egne ord.

Næste lektioner: **normalisering** (1NF–3NF) og **designmønstre**.
