---
title: 2. Views til sikkerhed og forenkling
slug: views-02-security
module: views
order: 2
kind: theory
objectives:
  - Begrunde views ift. “need to know”
  - Skjule kolonner og filtrere rækker
  - Kende forskel på view og kopi af data
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE VIEW v_public_products AS
    SELECT id, name, category, price
    FROM products
    WHERE in_stock = TRUE;
    SELECT * FROM v_public_products ORDER BY name;
---

# Views til sikkerhed og forenkling

Raymond får et konkret krav fra caféen: menuskærmen skal kun vise varer på lager og behøver ingen kundeoplysninger. Et view kan afgrænse de rækker og kolonner, skærmen læser. For at gøre afgrænsningen til adgangskontrol skal rettighederne også passe.

> [!RAYMOND:safe-lock] Hvad behøver skærmen at vide?
>
> Vælg de nødvendige felter til en offentlig menu. Hvilke felter udelader du, og hvorfor? Et lille, tydeligt resultat er lettere at begrunde end at give klienten alle kolonner for en sikkerheds skyld.

## Skjul kolonner

```sql
CREATE OR REPLACE VIEW v_public_products AS
SELECT id, name, category, price
FROM products
WHERE in_stock = TRUE;

SELECT * FROM v_public_products ORDER BY name;
```

Appen (eller en rolle) får kun `SELECT` på view’et — ikke på `products` direkte. Så kan I senere `GRANT`/`REVOKE` (næste modul).

## Filtrér rækker (“row filter”)

```sql
CREATE OR REPLACE VIEW v_viborg_customers AS
SELECT id, name, city
FROM customers
WHERE city = 'Viborg';
```

## View ≠ kopi

| | View | Tabel / materialiseret data |
|--|------|------------------------------|
| Lagring | Kun definitionen (`SELECT`) | Rækker på disk |
| Opdatering | Beregnes fra data, der er synlige for forespørgslens snapshot | En separat materialiseret kopi kan kræve synkronisering |
| Performance | Kører underliggende SQL hver gang | Kan være hurtigere (trade-off) |

Postgres har også **materialized views** (`CREATE MATERIALIZED VIEW` + `REFRESH`) — nyttigt til tunge rapporter. Til H1 er almindelige views nok.

## Café-scenarie

Forestil dig tre “brugere” af data:

1. **Barista-app** — `v_public_products` (navn, pris, kategori)
2. **Bogholder** — view med ordrer + beløb (`quantity * price`)
3. **Marketing** — kunder i Viborg uden e-mail-kolonne

Implementér mindst ét af dem, og forklar *hvorfor* det er bedre end `SELECT * FROM customers`.

## Tjek definitionen

```sql
SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public';
```

> [!RAYMOND:skeptical] Kan rollen gå uden om vinduet?
>
> Hvis samme rolle stadig kan læse `customers` direkte, beskytter et view uden e-mail ikke i sig selv e-mailkolonnen. Undersøg både viewet og andre adgangsveje. En ejerrolle i øvelsen er ikke bevis for, hvad en begrænset app-rolle må.

## Rettighederne er afgørende

I streng opsætning:

1. App-rollen har **ingen** `SELECT` på basistabeller  
2. App-rollen har `SELECT` på udvalgte views  
3. Views eksponerer kun tilladte kolonner/rækker  

En korrekt begrænset rolle kan reducere, hvilke data en sårbar forespørgsel kan nå. Det gør ikke SQL injection ufarlig: andre rettigheder, kald af funktioner og adgang gennem API’et skal stadig undersøges, og værdier skal fortsat sendes som parametre.

I SQL-H1 ejer du dine egne objekter og kan undersøge viewets resultat. En reel rettighedstest kræver en anden, begrænset rolle, eksempelvis i [sikkerhedslabben](/learn/security-project-01). Et almindeligt view kontrollerer normalt basistabellernes rettigheder med viewejerens rettigheder; indstillingen `security_invoker` ændrer dette. Vælg opsætningen bevidst.

## Column-level vs. view

| Tilgang | Pros |
|---------|------|
| `GRANT SELECT (col1, col2) ON t` | simpelt |
| View `v_…` | klarere API, kan joine/filtrere, lettere at versionere |

Til H1-projekter anbefales **views som læse-API** + Dapper `QueryAsync` mod viewet.

## Prøv selv

1. Opret `v_public_products` uden `in_stock`.  
2. Opret `v_viborg_customers` uden e-mail.  
3. Forklar hvilken “rolle” der må bruge hvilket view.

> [!RAYMOND:question] Adskil resultat og adgang
>
> Vis først, at dit view kun returnerer de ønskede oplysninger. Beskriv derefter, hvilken rolle du ville afprøve med, og hvad et direkte opslag i basistabellen skal gøre. Det er to forskellige kontroller.
