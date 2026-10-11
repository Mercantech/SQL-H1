---
title: 2. 1:1, 1:n og n:n
slug: relations-02-cardinalitet
module: relations
order: 2
kind: theory
objectives:
  - Forklare kardinalitet og optionalitet
  - Genkende 1:n og n:n i café-modellen
  - Vide hvor FK skal ligge
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.name, COUNT(o.id) AS antal_ordrer
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.name
    ORDER BY antal_ordrer DESC, c.name;
---

# 1:1, 1:n og n:n

**Kardinalitet** svarer på: *hvor mange* af den ene side hører til *hvor mange* af den anden?  
**Optionalitet** svarer på: *skal* der være et match, eller må det mangle (`NULL` / “0”)?

## Notation (læs et E/R-kort)

```text
customers (1) ────< (n) orders
```

Læs: én kunde har mange ordrer; hver ordre (med kunde) pejer på én kunde.

```text
products (1) ────< (n) orders
customers (n) >──< (n) products   via orders
```

## 1:n (én-til-mange) — arbejdhesten

Én kunde kan have **mange** ordrer. Hver ordre har **højst én** kunde.

**Regel:** FK ligger på **“mange”-siden** (`orders.customer_id`).

```sql
SELECT c.name, COUNT(o.id) AS antal_ordrer
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
ORDER BY antal_ordrer DESC;
```

`LEFT JOIN` viser også kunder med **0** ordrer (Clara) — kardinalitet “0..n” fra kundens synspunkt.

Samme mønster: ét produkt → mange ordrelinjer (`orders.product_id`).

### Hvorfor ikke omvendt?

Hvis du lagde `customer_id`-listen ind i `customers` (array/tekst), bryder du 1NF og mister FK-beskyttelse. 1:n *er* “FK på barnet”.

## n:n (mange-til-mange)

Kunder og produkter er n:n:

- én kunde køber mange produkter  
- ét produkt købes af mange kunder  

**Mønster:** indfør en **koblingstabel** (associativ entitet). Hos os er det `orders` (forenklet: én række = én linje).

```text
customers 1──< orders >──1 products
```

```sql
-- Hvilke produkter har Anna købt? (n:n via kobling)
SELECT DISTINCT p.name
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
WHERE c.name = 'Anna Jensen'
ORDER BY p.name;
```

I en “rigtig” webshop splitter man ofte:

```text
orders (hoved: hvem, hvornår, status)
order_lines (produkt, antal, linjepris)  →  products
```

Så er n:n mellem ordrehoved og produkt via `order_lines` — samme idé, flere niveauer.

## 1:1 (én-til-én)

Højst én række i A matcher højst én i B. Typisk:

- `customers` + `customer_profiles` (samme id)  
- “udskyd tunge kolonner” / separat adgangskontrol  

Implementeres ofte med **delt PK** eller UNIQUE FK.

Café-seed’en har ikke 1:1 — men du skal kunne *genkende* det i andres skemaer.

## Optionalitet (0..1 vs 1..1)

| Situation | Modellering |
|-----------|-------------|
| Ordre *skal* have produkt | `product_id NOT NULL` + FK |
| Ordre *må* mangle kunde | `customer_id NULL` + FK (walk-in) |
| Kunde *skal* have e-mail | `email NOT NULL` (har vi ikke — bevidst) |

```sql
SELECT
  COUNT(*) FILTER (WHERE customer_id IS NULL) AS walk_in,
  COUNT(*) FILTER (WHERE customer_id IS NOT NULL) AS med_kunde
FROM orders;
```

## Kardinalitet i JOIN-valg

| Du vil have… | Typisk JOIN |
|--------------|-------------|
| Kun match begge veje | `INNER JOIN` |
| Alle kunder, også uden ordrer | `LEFT JOIN` fra customers |
| Alle ordrer, også walk-in | `LEFT JOIN` fra orders til customers |

Kardinalitet i *modellen* er ikke det samme som JOIN-typen i *forespørgslen* — men de hænger sammen: forkert JOIN skjuler eller fordobler virkeligheden.

## Prøv selv

1. Vis hvor mange **forskellige** produkter hver kunde har købt (`COUNT(DISTINCT product_id)`).  
2. Tegn (på papir) 1:n mellem `products` og `orders` med FK-pilen.  
3. Forklar med egne ord, hvorfor n:n kræver en tabel i midten.
