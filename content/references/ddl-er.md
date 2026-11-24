# Fra E/R-skitse til databasens faktiske skema

| I skitsen | I PostgreSQL | Se efter |
|---|---|---|
| Leverandør | `CREATE TABLE suppliers …` | Kolonner, typer og PK på Database-siden. |
| Én leverandør kan levere mange produkter | FK fra `products.supplier_id` til `suppliers.id` | Pilen begynder ved den tabel, der gemmer referencen. |
| Produkt kan mangle leverandør | Kolonnen tillader NULL | Et produkt kan stadig eksistere uden tilknytning. |
| Alle nye rækker skal have en værdi | `NOT NULL`, eventuelt også `DEFAULT` | Ved en skemaændring skal gamle rækker også opfylde kravet. |
| Hyppigt opslag på leverandør | Indeks på `products.supplier_id` | Sammenhold filteret med planen fra EXPLAIN. Små tabeller kan give Seq Scan. |
| Pengebeløb med to decimaler | `NUMERIC(10,2)` | Datatypen fastlægger præcision og skala. Brug en separat regel til negative beløb. |

**Prøv i morgen.** Tegn kategorier og produkter. Markér den side, som ejer FK'en, og byg derefter [kategoritabellen](/learn/ddl-ex-02). Om en uge kan en makker få skitsen og finde samme relation på [Database-siden](/database).

[PostgreSQL om ændringer af tabeller](https://www.postgresql.org/docs/16/ddl-alter.html) · [Fremmednøgler](https://www.postgresql.org/docs/16/ddl-constraints.html) · [Introduktion til indeks](https://www.postgresql.org/docs/16/indexes-intro.html)
