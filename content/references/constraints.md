# Hvilken regel skal databasen håndhæve?

| Regel | Gyldigt eksempel | Hvad skal afvises? |
|---|---|---|
| `name TEXT NOT NULL` | `'Espresso'` | SQL-værdien NULL. Tom tekst er stadig en tilladt tekstværdi. |
| `price NUMERIC NOT NULL CHECK (price > 0)` | 0.01 | 0, −0.01 og NULL. Kravene om pris og positivitet er to separate regler. |
| `UNIQUE (email)` | To forskellige e-mails | Anden forekomst af samme udfyldte e-mail. Almindelig UNIQUE i PostgreSQL tillader flere NULL. |
| `orders.product_id REFERENCES products(id)` | En eksisterende vare | En henvisning til et produkt-id, der mangler. |
| `PRIMARY KEY (id)` | Ét udfyldt, unikt id pr. række | En gentagelse af id eller en tom nøgle. |

**Læs fejlen som en observation.** 23502 peger på NOT NULL, 23503 på fremmednøgle, 23505 på unikhed og 23514 på CHECK. Vælg en ellers gyldig række til hvert forsøg, så én regel forklarer resultatet.

**Prøv i morgen.** Afgør, om en anonym ordre må have en ukendt produktreference. Om en uge kan du vælge en normalværdi, en ulovlig værdi og en grænseværdi til [testplanen](/learn/testing-01-plan).

[PostgreSQL om constraints](https://www.postgresql.org/docs/16/ddl-constraints.html) · [Fejlkoder i PostgreSQL](https://www.postgresql.org/docs/16/errcodes-appendix.html)
