---
title: 5. Sammenhængende data og komplekse DELETE
slug: dml-05-cascade
module: dml
order: 5
kind: theory
objectives:
  - Forklare hvordan FK binder tabeller ved sletning
  - Skelne RESTRICT, CASCADE, SET NULL og SET DEFAULT
  - Vælge slettestrategi og rækkefølge bevidst
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    SELECT c.id, c.name,
           (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS antal_ordrer
    FROM customers c
    ORDER BY c.name;
---

# Sammenhængende data og komplekse DELETE

En `DELETE` på én tabel er sjældent “bare én række”. I en relationel database hænger data sammen — og **fremmednøgler** bestemmer, hvad der må ske, når du forsøger at slette.

## Grafen i caféen

Tænk tabellerne som et lille netværk:

```text
customers  ←——  orders  ——→  products
   (1)            (n)           (1)
```

- En **kunde** kan have mange **ordrer**.
- Et **produkt** kan indgå i mange **ordrer**.
- En **ordre** *peger* på kunde (valgfrit hos os) og produkt (påkrævet).

```sql
-- Se sammenhængen før du sletter
SELECT c.id, c.name,
       (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) AS antal_ordrer
FROM customers c
ORDER BY c.name;
```

Når `antal_ordrer > 0`, er kunden **ikke isoleret**. En naiv `DELETE FROM customers …` rammer et designvalg i databasen.

## Hvad er en “forældre” og et “barn”?

| Begreb | I caféen | Rolle ved DELETE |
|--------|----------|------------------|
| **Forælder** | `customers`, `products` | den række, andre peger på |
| **Barn** | `orders` | har FK (`customer_id`, `product_id`) |

Tommelfingerregel:

> Du kan ikke fjerne en forælder, hvis børn stadig peger på den — **medmindre** FK-reglen siger noget andet (CASCADE, SET NULL, …).

## FK-handlinger ved DELETE

Når du opretter en fremmednøgle (DDL — du må ikke køre det i MVP, men du **skal** forstå det), kan du angive:

```sql
-- Eksempel (teori — kør ikke ALTER i SQL-H1 MVP)
customer_id INT REFERENCES customers(id)
  ON DELETE RESTRICT   -- eller NO ACTION, CASCADE, SET NULL, SET DEFAULT
```

| `ON DELETE …` | Betydning | Typisk brug |
|---------------|-----------|-------------|
| **`RESTRICT` / `NO ACTION`** | Sletning af forælder **fejler**, hvis børn findes | Standard “beskyt historik” — det du mærker i café-seed’et |
| **`CASCADE`** | Slet forælder → **slet børnene automatisk** | Sjældent på kunder/ordrer; farligt uden bevidst design |
| **`SET NULL`** | Slet forælder → børns FK sættes til **`NULL`** | Kræver at kolonnen må være `NULL` (som vores walk-in `customer_id`) |
| **`SET DEFAULT`** | Slet forælder → FK sættes til kolonnens **DEFAULT** | Sjældnere; kræver meningsfuld default |

Postgres’ standard uden angivelse er i praksis **“blokér sletning, når der er referencer”** (`NO ACTION`/`RESTRICT`-agtigt). Derfor fejler:

```sql
DELETE FROM customers WHERE name = 'Anna Jensen';
-- fejl: orders refererer stadig til Anna
```

## Hvorfor CASCADE er kraftfuldt — og farligt

```sql
-- Teori-eksempel: CASCADE på orders → customers
-- DELETE FROM customers WHERE id = 1;
--  ⇒ alle Annas ordrer forsvinder AUTOMATISK
```

| Fordel | Risiko |
|--------|--------|
| Én kommando rydder hele “træet” | Du sletter mere end du tror |
| Matcher “fjern konto + alt indhold” | Ingen advarsel midt i kæden |
| Mindre manuel rækkefølge | Svært at fortryde uden backup |

**Cascading delete er et designvalg**, ikke “smart default”. Til ordrer/fakturering vælger man ofte **RESTRICT**: historik må ikke forsvinde, bare fordi nogen sletter en kunde.

## SET NULL — “gør til walk-in”

Hvis FK er `ON DELETE SET NULL` og kolonnen tillader `NULL`:

```text
DELETE kunde Anna
  → hendes ordrer beholder product_id / quantity
  → customer_id bliver NULL (anonym / walk-in)
```

I vores seed *må* `customer_id` være `NULL`, men FK er **ikke** sat til `SET NULL` automatisk ved sletning af kunde. Du kan dog **selv** efterligne ideen manuelt:

```sql
-- Manuel "SET NULL"-strategi (DML, tilladt)
UPDATE orders
SET customer_id = NULL
WHERE customer_id = (SELECT id FROM customers WHERE name = 'Anna Jensen');

-- Nu kan kunden slettes (ingen børn peger længere)
DELETE FROM customers WHERE name = 'Anna Jensen';
```

Det er bevidst: du **bevarer ordrerne**, men fjerner personkoblingen (GDPR-agtigt mønster i forenklet form).

## Tre strategier du skal kunne vælge imellem

### 1) Blokér (RESTRICT) — “slet ikke kunden”

```sql
-- Fejler bevidst — godt til at beskytte historik
DELETE FROM customers WHERE name = 'Anna Jensen';
```

Forretning: “Kunden har ordrer — afmeld i stedet / anonymisér.”

### 2) Slet børn først — manuel kaskade

```sql
DELETE FROM orders
WHERE customer_id = (SELECT id FROM customers WHERE name = 'Anna Jensen');

DELETE FROM customers WHERE name = 'Anna Jensen';
```

Du *simulerer* CASCADE med to DML-trin. Gennemsigtigt — og du ser præcis hvad der forsvinder (`RETURNING` hjælper).

### 3) Anonymisér — UPDATE så DELETE

```sql
UPDATE orders SET customer_id = NULL
WHERE customer_id = (SELECT id FROM customers WHERE name = 'Bo Nielsen');

DELETE FROM customers WHERE name = 'Bo Nielsen';
```

Ordrer overlever som walk-in; kunden er væk.

## Produkter er også forældre

Samme logik den anden vej:

```sql
-- Fejler typisk: Espresso indgår i ordrer
DELETE FROM products WHERE name = 'Espresso';
```

Her er `ON DELETE CASCADE` fra `orders.product_id` → `products` næsten aldrig ønsket: så ville historiske linjer forsvinde, når menuen ændres. Ofte: **udfas produkt** (`UPDATE in_stock = FALSE`) i stedet for Delete.

```sql
UPDATE products
SET in_stock = FALSE
WHERE name = 'Espresso';
```

Det er soft-delete / status — ikke CASCADE.

## Flere niveauer (tænk fremad)

I større systemer:

```text
customers → orders → order_lines → payments
                ↘ shipments
```

En CASCADE fra toppen kan slette **hele træet**. Uden CASCADE skal du slette **indefra og ud** (dybeste børn først) eller bruge soft-delete.

Selv med kun tre tabeller gælder princippet: **kend grafen, før du sletter.**

## Tjekliste før en “kompleks” DELETE

1. Hvilken tabel er forælder — hvilke er børn?
2. Hvad siger FK (`RESTRICT` / `CASCADE` / `SET NULL`)?
3. Vil jeg fjerne historik, eller kun koblingen til personen?
4. Har jeg `SELECT`’et børnene først?
5. Skal jeg bruge `RETURNING` / backup / transaktion i produktion?

```sql
-- Preview børn
SELECT o.id, o.quantity, p.name AS produkt
FROM orders o
JOIN products p ON p.id = o.product_id
WHERE o.customer_id = (SELECT id FROM customers WHERE name = 'Anna Jensen');
```

## Hvad du *ikke* skal gøre i SQL-H1 MVP

- `ALTER TABLE … ON DELETE CASCADE` (DDL — ikke tilladt)
- Blindt slette uden preview
- Antage at “det virker som i MySQL med løse FK”

Du **skal** kunne forklare forskellen på strategierne til en eksamen eller en kollega.

## Prøv selv

1. Find en kunde med ordrer. Forsøg `DELETE` på kunden — læs fejlbeskeden.
2. Vælg strategi **manuel kaskade**: slet kundens ordrer med `RETURNING`, slet derefter kunden.
3. **Nulstil data.** Gentag med strategi **anonymisér** (`UPDATE … SET customer_id = NULL`), og slet kunden. Sammenlign hvad der er tilbage i `orders`.

Når du kan vælge mellem blokér / kaskade / anonymisér, forstår du hvorfor Delete er den mest “arkitektoniske” af CRUD-operationerne.
