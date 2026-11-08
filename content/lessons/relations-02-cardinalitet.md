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

Raymond vil vide, om en ny tabel skal gemme én henvisning eller flere tilknyttede rækker. **Kardinalitet** beskriver, hvor mange rækker der kan høre sammen. **Optionalitet** beskriver, om et match skal findes eller gerne må mangle; en kunde uden ordrer og en ordre med NULL-kunde er to forskellige former for fravær.

> [!RAYMOND:foreign-key] Læs reglen som en sætning
>
> Én kunde kan have mange ordrer. Hvor i skemaet skal vi så gemme den enkelte ordres kunde-id? Forklar først, hvorfor en ordre kun behøver én sådan henvisning.

## Notation (læs et E/R-kort)

```text
customers (1) ────< (n) orders
```

Læs: én kunde har mange ordrer; hver ordre (med kunde) peger på én kunde.

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

Hvis du gemmer en liste af ordre-id’er som tekst eller array i kunderækken, bliver det vanskeligere at håndhæve relationen til hver ordre. En almindelig FK kontrollerer ikke hvert element i en sådan liste. Raymond modellerer derfor denne 1:n-forbindelse med én FK på hver ordrerække; PostgreSQL-arrays har andre anvendelser, men erstatter ikke denne relation automatisk.

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

> [!RAYMOND:skeptical] Højst én er ikke det samme som præcis én
>
> En UNIQUE FK kan forhindre to profiler til samme kunde. Den sikrer ikke alene, at alle kunder faktisk har en profil. Hvilken ekstra regel eller arbejdsgang ville være nødvendig, hvis profilen er obligatorisk?

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

Raymond skelner mellem, hvad **modellen tillader**, og hvad en **forespørgsel viser**. JOIN-typen skaber ikke en 1:n-regel; den bestemmer, hvilke matches og manglende matches vi ser. Reglerne kommer fra nøgler og constraints.

> [!RAYMOND:question] Kan få rækker bevise en regel?
>
> To tabeller kan tilfældigvis have én række hver uden at være en 1:1-model. Peg på den nøgle eller UNIQUE-regel, som gør din påstand sand, også når der kommer flere data.

## Prøv selv

1. Vis hvor mange **forskellige** produkter hver kunde har købt (`COUNT(DISTINCT product_id)`).  
2. Tegn (på papir) 1:n mellem `products` og `orders` med FK-pilen.  
3. Forklar med egne ord, hvorfor n:n kræver en tabel i midten.
