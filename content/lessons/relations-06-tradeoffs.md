---
title: 6. Normalisering vs. pragmatisme
slug: relations-06-tradeoffs
module: relations
order: 6
kind: theory
objectives:
  - Afveje 3NF mod læseperformance og enkelhed
  - Genkende bevidst denormalisering
  - Lave et lille design-review af caféen
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT p.category, COUNT(*) AS produkter, ROUND(AVG(p.price), 2) AS snit
    FROM products p
    GROUP BY p.category
    ORDER BY p.category;
---

# Normalisering vs. pragmatisme

3NF er et **mål**, ikke en religion. I projektet skal I kunne sige: “Vi normaliserer her — og *her* denormaliserer vi bevidst.”

## Hvad café-seed’en “skylder” 3NF

| Observation | Ren 3NF | Pragmatisk valg i seed |
|-------------|---------|------------------------|
| `products.category` som tekst | `categories`-tabel + FK | Fri tekst — simpelt til undervisning |
| Ordre = én produktlinje | `orders` + `order_lines` | Fladet ind i `orders` |
| Ingen pris-historik på linjen | gem `unit_price` på linjen | Bruger altid nuværende `products.price` |

Det sidste er en **ægte faldgrube**: hvis I ændrer produktprisen, ændrer gamle ordrers “linjebeløb” sig, hvis I joiner live. I produktion gemmer man ofte `unit_price` på ordrelinjen.

## Bevidst denormalisering

Eksempler der *kan* være OK:

- Gem `customer_name` på en faktura-tabel (snapshot)
- Cache `order_total` der opdateres af trigger/app
- Materialized view til dashboard

Krav: I ved **hvem** der opdaterer den afledte data, og **hvordan** I undgår inkonsistens.

## Mini design-review (caféen)

Besvar for jer selv / i gruppen:

1. Hvor er 1:n og hvor er n:n (evt. skjult)?
2. Hvilken kolonne ville I løfte til lookup først?
3. Hvad sker der med historik, hvis `products.price` ændres?
4. Hvor ville I lægge soft delete (`deleted_at`) hvis kunder ikke må fjernes fysisk?

## Beslutningsramme (brug den i projektet)

For hvert “skævt” felt I overvejer at denormalisere:

1. **Hvor ofte opdateres kilden?** (sjældent → snapshot er sikrere)  
2. **Hvem ejer sandheden?** (én tabel vs. flere lag)  
3. **Hvad koster en inkonsistens?** (faktura ≠ dashboard-cache)  
4. **Kan et view / materialized view løse læsebehovet uden at kopiere?**  

```sql
-- Læsevenlig “rapport” uden at denormalisere stamdata
SELECT c.city, COUNT(*) AS ordrer, SUM(o.quantity * p.price) AS approx_omsaetning
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
GROUP BY c.city
ORDER BY approx_omsaetning DESC;
```

Bemærk: `approx_omsaetning` bruger **nutidens** pris — det er præcis trade-offen fra tidligere.

## OLTP vs. OLAP (kort)

| | OLTP (daglig app) | OLAP / BI |
|--|-------------------|-----------|
| Design | 3NF, mange små tabeller | stjerne, færre JOIN |
| Belastning | mange små skrivninger | tunge aggregeringer |
| Café-seed | her | kunne spejles i et view senere |

## Til H1-projektet

Afleveringen bør kunne pege på:

- E/R eller skema-diagram  
- Mindst én bevidst trade-off (“vi valgte X fordi …”)  
- Hvordan API’en mapper til tabeller (ADO.NET/Dapper)  
- Hvor I *ikke* denormaliserer — og hvorfor  

## Prøv selv

1. Skriv én sætning: “Vi denormaliserer ___ fordi ___ ; sandheden bor stadig i ___.”  
2. Peg på én ting i café-seed’en I ville ændre i et rigtigt kassesystem.  
3. Diskutér: er `category` som tekst acceptabelt i en MVP? Hvornår stopper det med at være det?
