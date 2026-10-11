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

En **constraint** er en regel databasen **håndhæver** — uanset om klienten er SQL-H1, en .NET-API eller `psql`. Det er jeres sidste forsvarslinje for datakvalitet.

## Katalog over de vigtigste

| Constraint | Garanti | Café-eksempel |
|------------|---------|---------------|
| `PRIMARY KEY` | unik + NOT NULL | `customers.id` |
| `NOT NULL` | kolonnen skal udfyldes | `products.price` |
| `UNIQUE` | højst én forekomst (flere `NULL` OK i PG) | (tilføjes ofte på e-mail) |
| `CHECK` | boolsk udtryk skal være sandt | `price > 0` |
| `FOREIGN KEY` | værdi findes i forældre-tabel (eller `NULL`) | `orders.product_id` |

Her **mærker** du reglerne med DML. At *oprette* dem med `ALTER TABLE` øver du også i dette modul og i *Tabeller og E/R*.

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
- FK *bør* have indeks på barn-kolonnen for performance (se DDL-modulet)

## Prøv selv

1. Fremprovokér `NOT NULL`-fejl og `FK`-fejl — læs begge beskeder.  
2. Indsæt en gyldig walk-in og verificér med `SELECT`.  
3. Nulstil databasen, når du er færdig med eksperimenterne.
