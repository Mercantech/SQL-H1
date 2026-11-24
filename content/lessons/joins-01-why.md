---
title: 1. Hvorfor JOIN?
slug: joins-01-why
module: joins-subqueries
order: 1
kind: theory
objectives:
  - Forstå relationer mellem tabeller
  - Se problemet uden JOIN
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT * FROM orders LIMIT 5;
---

# Hvorfor JOIN?

Raymond skal læse en ordre højt: Hvem købte hvad? Caféen gemmer kunder og produkter i hver sin tabel, og `orders` henviser til dem med `customer_id` og `product_id`. Derfor er én ordretabel ikke nok til hele sætningen.

```sql
SELECT * FROM orders LIMIT 5;
```

Du ser tal, ikke “Anna købte Espresso”.

> [!RAYMOND:foreign-key] Tallene er henvisninger
>
> Kunde-id 1 og produkt-id 1 er ikke samme slags ting, selvom begge er tallet 1. Peg på, hvilken tabel hvert id henviser til, før du slår navnene op.

## Den dårlige idé: mange SELECT

```sql
SELECT name FROM customers WHERE id = 1;
SELECT name FROM products WHERE id = 1;
```

Raymond vil undgå at hente et navn i et nyt databasekald for hver eneste ordre. Med JOIN beskriver vi sammenhængen i én forespørgsel og lader databasen kombinere oplysningerne.

```teach
{
  "question": "I caféens startdata har ordre 2 customer_id 1 og product_id 3. Hvilket navn og hvilken vare skal stå på bonen? Slå begge nøgler op hver for sig.",
  "answer": "Kunde 1 er Anna Jensen, og produkt 3 er Croissant. Ordren skal forbinde customer_id til customers.id og product_id til products.id. Ordrenummeret identificerer selve bonlinjen."
}
```

## Se nøglerne i aktion

Klik rundt i diagrammet: hver streg er et match på `customer_id`. Clara har ingen ordrer, og der findes walk-in-ordrer med `customer_id NULL`. Diagrammet bruger et lille demonstrationsdatasæt; SQL-editoren bruger caféens større seed. Begge viser, hvorfor manglende matches betyder noget.

```join-viz
match
```

## Nøglerne

| Tabel | Primærnøgle | Fremmednøgle |
|-------|-------------|--------------|
| `customers` | `id` | — |
| `products` | `id` | — |
| `orders` | `id` | `customer_id` → customers (kan være `NULL`), `product_id` → products |

> [!RAYMOND:question] Hvilke rækker må vi miste?
>
> Skal rapporten også vise kunder uden ordrer og ordrer uden en registreret kunde? Gem spørgsmålet: JOIN-typen afgør, om de rækker overlever i resultatet.

Næste lektion: `INNER JOIN` — kun de rækker, hvor nøglerne matcher.

Prøv [minicaféens første match](/forloeb/joins/lessons/0001-find-match.html) med fire andre ordrer.

Fordybelse i PostgreSQL · [Følg nøgler i et JOIN](https://www.postgresql.org/docs/16/tutorial-join.html).
