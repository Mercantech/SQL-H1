# Hvilke rækker skal rapporten bevare?

| Rapportens spørgsmål | Konstruktion | Én resultatrække betyder |
|---|---|---|
| Hvem købte hvad? | `orders JOIN customers … JOIN products …` | Ét matchet køb med navngiven kunde. |
| Hvad solgte hver vare, også den usolgte? | `products LEFT JOIN orders …` | En ordrelinje eller en bevaret vare med NULL i ordrefeltet. |
| Hvilke kunder har købt mindst én gang? | `WHERE EXISTS (SELECT …)` | Én kunde med mindst ét match. |
| Hvilke varer er aldrig solgt? | `WHERE NOT EXISTS (SELECT …)` | Én vare uden noget match. |
| Hvad koster mere end gennemsnittet? | Skalar underforespørgsel med `AVG` | Et produkt sammenlignet med én beregnet værdi. |
| Kan jeg dele rapporten i læselige trin? | `WITH … AS (…)` | Det, som det yderste SELECT vælger fra delresultatet. |

**Tegn en række, før du tæller.** Ved et LEFT JOIN giver en usolgt vare én bevaret række. Derfor viser `COUNT(*)` én, mens `COUNT(o.id)` viser nul. Vælg den tælling, caféen faktisk efterspørger.

**Prøv i morgen.** Genskab matchene i [minicaféens printark](/forloeb/joins/reference/joins.html), før du folder arket ud. Om en uge kan du skrive et anti-join på det større cafédatasæt i [opgave D](/learn/joins-ex-04). Eller prøv at forbinde to tabeller i [SQL-mysteriet](/murder), hvor sagen har sit eget skema.

[PostgreSQL om JOIN](https://www.postgresql.org/docs/16/queries-table-expressions.html) · [EXISTS og underforespørgsler](https://www.postgresql.org/docs/16/functions-subquery.html)
