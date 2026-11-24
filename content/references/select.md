# Fra caféspørgsmål til SELECT

| Hvis rapporten skal … | Brug | Kontrollér |
|---|---|---|
| vise et udvalg af kolonner | `SELECT name, price FROM products` | Én række betyder stadig ét produkt. |
| vise unikke byer | `SELECT DISTINCT city` | Alle de valgte kolonner indgår i sammenligningen. |
| filtrere varer | `WHERE price >= 40` | En pris på præcis 40 skal med. |
| vise de to dyreste | `ORDER BY price DESC, id LIMIT 2` | Ekstra nøgle afgør rækkefølgen ved samme pris. |
| filtrere grupper | `GROUP BY category HAVING COUNT(*) >= 3` | Kravet gælder gruppens størrelse. |
| bevare hver vare og vise en placering | `DENSE_RANK() OVER (ORDER BY price DESC)` | To lige priser deler en placering. |
| finde en manglende e-mail | `WHERE email IS NULL` | `COALESCE` kan levere en læsbar tekst i resultatet. |

**To lister.** `UNION` samler uden identiske resultatrækker. `UNION ALL` bevarer gentagelser. `INTERSECT` finder de fælles rækker, og `EXCEPT` beholder rækker fra venstre liste, som mangler i højre.

**Prøv i morgen.** Hent de to dyreste varer i kategorien Drikke med arket lukket. Om en uge kan du finde den dyreste i *hver* kategori og forklare forskellen i antal rækker. [Øv sortering](/learn/select-ex-02) · [Øv placeringer](/learn/select-ex-05).

[PostgreSQL om resultatrækkefølge](https://www.postgresql.org/docs/16/queries-order.html) · [Vinduesfunktioner](https://www.postgresql.org/docs/16/tutorial-window.html)
