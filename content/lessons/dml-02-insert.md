---
title: 2. INSERT — Create i dybden
slug: dml-02-insert
module: dml
order: 2
kind: theory
objectives:
  - Forstå INSERT som CRUD Create
  - Indsætte én eller flere rækker sikkert
  - Bruge DEFAULT, INSERT … SELECT og RETURNING
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    INSERT INTO products (name, category, price, in_stock)
    VALUES ('Iste', 'Drikke', 29.00, TRUE)
    RETURNING id, name, price, in_stock;
---

# INSERT — Create i dybden

**INSERT** er CRUD-**Create**: du tilføjer *nye* rækker. Eksisterende rækker røres ikke (medmindre triggers/regler i andre systemer — her holder vi det enkelt).

Mentalt: “Her er en ny kendsgerning, databasen skal huske.”

## Anatomi

```sql
INSERT INTO tabel (kolonne1, kolonne2, …)
VALUES (værdi1, værdi2, …);
```

- **`INTO tabel`** — hvor rækken skal lande.
- **Kolonnelisten** — hvilke felter *du* sætter. Resten får `DEFAULT` eller `NULL` (hvis tilladt).
- **`VALUES`** — de konkrete værdier i samme rækkefølge som kolonnelisten.

### Hvorfor nævne kolonner eksplicit?

```sql
-- Skrøbeligt: afhænger af kolonners rækkefølge i tabellen
INSERT INTO products VALUES (DEFAULT, 'Iste', 'Drikke', 29.00, TRUE);

-- Robust: tydeligt hvad der sættes
INSERT INTO products (name, category, price, in_stock)
VALUES ('Iste', 'Drikke', 29.00, TRUE);
```

I applikationskode (og i gode vaner) bruger du **altid** navngivne kolonner.

## Create én række

```sql
INSERT INTO products (name, category, price, in_stock)
VALUES ('Iste', 'Drikke', 29.00, TRUE);
```

Tjek bagefter (Read):

```sql
SELECT * FROM products WHERE name = 'Iste';
```

### DEFAULT og SERIAL

Kolonner du **ikke** nævner, får tabellens default:

| Kolonne (eksempel) | Typisk default |
|--------------------|----------------|
| `products.id` | `SERIAL` → næste heltal |
| `products.in_stock` | `TRUE` hvis du udelader den |
| `customers.created_at` | `CURRENT_DATE` |

```sql
-- in_stock udelades → DEFAULT TRUE
INSERT INTO products (name, category, price)
VALUES ('Kaffe to go', 'Drikke', 30.00);
```

`NULL` er **ikke** det samme som “udelad kolonnen”:

- Udelad → `DEFAULT`
- Skriv `NULL` → eksplicit tom (kun hvis kolonnen tillader `NULL`)

```sql
INSERT INTO customers (name, city, email)
VALUES ('Helle Dam', 'Aalborg', NULL);  -- email må være NULL
```

## Create flere rækker (batch)

Én sætning, mange rækker — effektivt og atomisk i samme statement:

```sql
INSERT INTO customers (name, city, email) VALUES
  ('Gustav Berg', 'Odense', 'gustav@example.com'),
  ('Helle Dam', 'Aalborg', NULL);
```

Brug det når du seed’er testdata eller importerer en lille liste. Til kæmpe imports findes andre værktøjer (`COPY` m.m.) — uden for MVP.

## INSERT … SELECT (Create fra Read)

Create behøver ikke komme fra tastaturet. Du kan **læse** rækker og **indsætte** resultatet:

```sql
INSERT INTO products (name, category, price, in_stock)
SELECT name || ' (kopi)', category, price, FALSE
FROM products
WHERE name = 'Te';
```

Mønstre i virkeligheden:

- arkivér / kopiér til historik-tabel
- opret “kladde”-produkter ud fra eksisterende
- materialisér et udsnit (forsigtigt — undgå utilsigtede dubletter)

## Constraints stopper dårlige Creates

Prøv at forstå *hvorfor* en INSERT fejler:

```sql
-- Fejler: name er NOT NULL
INSERT INTO products (name, category, price)
VALUES (NULL, 'Drikke', 10);

-- Fejler: customer_id 999 findes ikke (FK)
INSERT INTO orders (customer_id, product_id, quantity, order_date)
VALUES (999, 1, 1, '2024-05-01');

-- OK: walk-in (customer_id må være NULL i vores seed)
INSERT INTO orders (customer_id, product_id, quantity, order_date)
VALUES (NULL, 1, 1, '2024-05-01');
```

**Create + constraints** = databasen er din første valideringslag — før din C#-kode.

## RETURNING — Create der svarer

I PostgreSQL kan `INSERT` **returnere** den oprettede række (nyttigt til API’er: “her er det nye `id`”):

```sql
INSERT INTO products (name, category, price)
VALUES ('Kaffe to go', 'Drikke', 30.00)
RETURNING id, name, price, in_stock;
```

Det er stadig DML Create — ikke et separat `SELECT`, selvom resultatet ligner et.

## INSERT og dubletter

Uden `UNIQUE` på fx `products.name` kan du indsætte “Espresso” to gange. Det er lovligt i vores seed — men forretningsmæssigt måske forkert. Tænk:

1. Skal navnet være unikt? (constraint / unik indeks — DDL, senere)
2. Eller tjekker applikationen først med `SELECT`?

Som elev: brug `SELECT` før/efter, så du *ser* om du lavede en dobbelt-Create.

## Sammenhæng med CRUD-flow

```text
UI: "Opret produkt"
  → API: POST
    → SQL: INSERT … RETURNING id
      → svar: { id: 42, name: "…" }
```

Næste lektion: **UPDATE** — CRUD Update.

## Prøv selv

Indsæt produktet **`Sockerkaka`** i kategorien **`Bagværk`** til **`24.00`**, og brug `RETURNING` så du ser `id`.
