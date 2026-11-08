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

Raymond beder dig tage arkitekthatten på: Hvilke fakta gemmer caféen, hvilke regler beskytter dem, og hvad skal rapporterne kunne? Et godt designvalg kan forklares med et behov og en konsekvens. Vi skelner mellem normalisering, historik og afledte kopier.

> [!RAYMOND:thinking] Hvilken oplysning skal overleve?
>
> Når en vare får en ny pris, skal gårsdagens kvittering så ændre sig? Besvar først spørgsmålet om betydning. Det kommer før en diskussion om færre tabeller eller hurtigere forespørgsler.

## Tre valg i caféens forenklede model

| Observation | Behov vi skal undersøge | Mulig udvidelse |
|-------------|--------------------------|-----------------|
| products.category er tekst | Fælles stavning og oplysninger om kategorien | categories-tabel og FK |
| Én ordrerække er én produktlinje | Flere linjer under samme ordrehoved | orders og order_lines |
| Kun aktuel produktpris | Dokumentere den aftalte pris ved købet | unit_price på købs-/ordrelinjen |

Valgene er ikke i sig selv en liste over 3NF-brud. Normalformer undersøges ud fra nøgler og afhængigheder. Den sidste række er et særligt vigtigt **historikkrav**: Et JOIN til den aktuelle produktpris kan ikke alene dokumentere prisen ved et tidligere køb.

## Historiske fakta og afledte kopier

Raymond skelner mellem to formål:

- **Historik:** Et kundenavn på en udstedt faktura beskriver tidspunktet for fakturaen. Det skal ikke nødvendigvis følge kundens navn nu.
- **Afledt kopi:** En cache af den aktuelle order_total skal holdes i overensstemmelse med sine kilder. Et materialized view gemmer også et resultat, der kan blive forældet.

Historiske fakta er ikke automatisk normaliseringsbrud. Ved en afledt kopi skal I derimod beskrive, hvem der opdaterer den, hvornår det sker, og hvor gammel den må være.

## Mini design-review (caféen)

Besvar for jer selv / i gruppen:

1. Hvor er 1:n og hvor er n:n (evt. skjult)?
2. Hvilken kolonne ville I løfte til lookup først?
3. Hvad sker der med historik, hvis `products.price` ændres?
4. Hvor ville I lægge soft delete (`deleted_at`) hvis kunder ikke må fjernes fysisk?

> [!RAYMOND:skeptical] Et view og en gemt kopi er forskellige valg
>
> Et almindeligt view gemmer en forespørgselsdefinition. Et materialized view gemmer resultatdata, som skal opdateres med REFRESH. Hvem opdager det, hvis dashboardets kopi er gammel, og hvilken alder kan brugeren acceptere?

## Beslutningsramme (brug den i projektet)

For hver historisk oplysning eller afledt kopi, I overvejer:

1. **Hvilket tidspunkt beskriver værdien?** Skal den bevare fortiden eller følge en aktuel kilde?
2. **Hvem ejer sandheden?** Hvilke ændringer må påvirke resultatet?
3. **Hvad koster en uoverensstemmelse?** En faktura og en dashboard-cache har forskellige behov.
4. **Hvad er målt?** Kan en almindelig forespørgsel eller et view løse behovet, før I indfører en gemt kopi?

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
| Typisk design | normaliserede tabeller til korrekte ændringer | ofte stjernemodel til analyse |
| Belastning | mange små skrivninger | tunge aggregeringer |
| Café-seed | her | kunne spejles i et view senere |

## Til H1-projektet

Afleveringen bør kunne pege på:

- E/R eller skema-diagram  
- Mindst én bevidst trade-off (“vi valgte X fordi …”)  
- Hvordan API’en mapper til tabeller (ADO.NET/Dapper)  
- Hvor I *ikke* denormaliserer — og hvorfor  

> [!RAYMOND:question] Kan dit valg efterprøves?
>
> Skriv ét konkret behov, dit valgte design og én kontrol, der kan afsløre en fejl. Hvis argumentet er performance, vil jeg også se en sammenlignelig måling — ikke kun en fornemmelse af, at færre JOINs må være hurtigere.

## Prøv selv

1. Skriv én sætning: “Vi denormaliserer ___ fordi ___ ; sandheden bor stadig i ___.”  
2. Peg på én ting i café-seed’en I ville ændre i et rigtigt kassesystem.  
3. Diskutér: er `category` som tekst acceptabelt i en MVP? Hvornår stopper det med at være det?

Kilde til forskellen på gemte resultater og almindelige views: [PostgreSQLs materialized views](https://www.postgresql.org/docs/16/rules-materializedviews.html).
