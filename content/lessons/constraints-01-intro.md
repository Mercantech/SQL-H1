---
title: 1. Constraints i praksis
slug: constraints-01-intro
module: constraints
order: 1
kind: theory
objectives:
  - Kende NOT NULL, UNIQUE, CHECK, PK og FK
  - Mærke constraints via DML-fejl
  - Forklare hvorfor regler hører hjemme i databasen
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    INSERT INTO products (name, category, price) VALUES (NULL, 'Drikke', 10);
---

# Constraints i praksis

Raymond får en ordre, som peger på en kunde, caféen aldrig har haft. Den skal ikke kunne snige sig ind, selv hvis en klient glemmer sin validering. En **constraint** er en regel, som databasen håndhæver ved ændringer, uanset om SQL kommer fra editoren, en .NET-API eller `psql`.

## Katalog over de vigtigste

| Constraint | Garanti | Café-eksempel |
|------------|---------|---------------|
| `PRIMARY KEY` | unik + NOT NULL | `customers.id` |
| `NOT NULL` | kolonnen skal udfyldes | `products.price` |
| `UNIQUE` | højst én forekomst (flere `NULL` OK i PG) | (tilføjes ofte på e-mail) |
| `CHECK` | afviser rækker, hvor udtrykket er `FALSE`; `NULL`/UNKNOWN accepteres | `price > 0` kombineret med `NOT NULL`, hvis pris kræves |
| `FOREIGN KEY` | værdi findes i forældre-tabel (eller `NULL`) | `orders.product_id` |

Her **mærker** du reglerne med DML. At *oprette* dem med `ALTER TABLE` øver du også i dette modul og i *Tabeller og E/R*.

> [!RAYMOND:question] Er tom tekst også NULL?
>
> En tom tekst `''` er en tekstværdi; `NULL` er en manglende eller ukendt værdi. Hvilken af dem stopper `NOT NULL`? Beslut, om din forretningsregel også kræver mere end blot en ikke-NULL-værdi.

## NOT NULL

Prøv (skal fejle):

```sql
INSERT INTO products (name, category, price)
VALUES (NULL, 'Drikke', 10);
```

Postgres: typisk `not_null_violation`. Læs fejlteksten — den nævner kolonnen.

**App vs. DB:** Validering i C# er god UX; `NOT NULL` i DB er garanti, hvis nogen glemmer valideringen.

## Fremmednøgle

Ugyldigt kunde-id fejler (kunden findes ikke):

```sql
INSERT INTO orders (customer_id, product_id, quantity, order_date)
VALUES (999, 1, 1, '2024-05-01');
```

Walk-in er OK — `customer_id` må være `NULL`:

```sql
INSERT INTO orders (customer_id, product_id, quantity, order_date)
VALUES (NULL, 1, 1, '2024-05-01');
```

| FK-kolonne | NULL tilladt? | Betydning |
|------------|---------------|-----------|
| `product_id` | nej | ordre *skal* pege på produkt |
| `customer_id` | ja | walk-in / anonym |

> [!RAYMOND:foreign-key] Valgfri reference, stadig gyldig reference
>
> Caféens kunde er valgfri på en ordre, men produktet er påkrævet. Derfor kræver `product_id` både FK og `NOT NULL`. En fremmednøgle alene gør ikke en nullable reference obligatorisk.

## Hvorfor constraints i databasen?

| Uden constraints | Med constraints |
|------------------|-----------------|
| “forkerte” ordrer kan snege sig ind via bug | DB afviser ugyldigt |
| hver klient skal huske reglerne | én sandhed |
| svært at stole på rapporter | data er konsistent nok til JOIN |

Constraints er **ikke** erstatning for forretningslogik (rabatter, workflow) — men de sikrer *strukturel* sandhed: nøgler, typer, relationer.

## Fejltyper du skal genkende

Når I debugger API eller SQL-H1, kig efter:

| Situation | Typisk signal |
|-----------|----------------|
| Mangler værdi | `not_null_violation` |
| Dobbelt unik værdi | `unique_violation` |
| CHECK brudt | `check_violation` |
| FK brudt | `foreign_key_violation` |

Navngiv constraints i DDL (`CONSTRAINT products_price_positive …`), så fejlbeskeden er læsbar.

## Constraints ≠ indexes (men de hænger sammen)

- `PRIMARY KEY` og `UNIQUE` opretter typisk et **indeks** automatisk  
- `CHECK` og `NOT NULL` gør **ikke** i sig selv et indeks  
- PostgreSQL opretter ikke automatisk indeks på FK-kolonnen i barnet. Overvej et ud fra opslag, sletninger og datamængde; mål effekten i DDL-modulet.

## Prøv selv

1. Fremprovokér `NOT NULL`-fejl og `FK`-fejl — læs begge beskeder.  
2. Indsæt en gyldig walk-in og verificér med `SELECT`.  
3. Nulstil databasen, når du er færdig med eksperimenterne.

> [!RAYMOND:primary-key] Vælg reglen med en begrundelse
>
> Navnet skal udfyldes, e-mailen skal være unik, og ordren skal pege på et produkt. Find en constraint til hvert krav. Forklar også, hvilket ekstra krav `CHECK (price > 0)` ikke håndhæver, hvis prisen må være `NULL`.
