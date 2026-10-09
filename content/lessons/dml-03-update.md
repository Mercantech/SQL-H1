---
title: 3. UPDATE — Update i dybden
slug: dml-03-update
module: dml
order: 3
kind: theory
objectives:
  - Forstå UPDATE som CRUD Update
  - Skrive sikre WHERE-filtre
  - Opdatere med udtryk, flere kolonner og subqueries
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    SELECT id, name, price, category
    FROM products
    WHERE category = 'Drikke'
    ORDER BY name;
---

# UPDATE — Update i dybden

**UPDATE** er CRUD-**Update**: du ændrer *eksisterende* rækker. Ingen nye rækker skabes; ingen slettes — værdier i kolonner erstattes.

Mentalt: “Ret denne kendsgerning.”

## Anatomi

```sql
UPDATE tabel
SET kolonne = ny_værdi, …
WHERE betingelse;
```

| Del | Betydning |
|-----|-----------|
| `UPDATE tabel` | hvilken tabel |
| `SET …` | hvad der skal ændres |
| `WHERE …` | **hvilke rækker** — det vigtigste |

### Den klassiske faldgrube

```sql
-- FARLIGT: opdaterer ALLE produkter
UPDATE products SET price = 0;
```

Uden `WHERE` betyder Update “hele tabellen”. I produktion kan det være katastrofalt. Vanen:

```sql
-- 1) Preview (Read)
SELECT id, name, price
FROM products
WHERE category = 'Drikke';

-- 2) Update med SAMME filter
UPDATE products
SET price = ROUND(price * 1.10, 2)
WHERE category = 'Drikke';

-- 3) Verificér
SELECT id, name, price
FROM products
WHERE category = 'Drikke';
```

## Update én række (via PK)

Mest sikkert — matcher typisk `PATCH /products/1`:

```sql
UPDATE products
SET price = 30.00
WHERE id = 1;   -- Espresso i seed
```

Eller via unik forretningsnøgle, hvis du er sikker:

```sql
UPDATE products
SET price = 30.00
WHERE name = 'Espresso';
```

Pas på: hvis to rækker hedder det samme, opdateres begge.

## Flere kolonner i samme Update

Én `UPDATE` kan sætte flere felter atomisk:

```sql
UPDATE products
SET price = 26.00,
    in_stock = TRUE
WHERE name = 'Te';
```

Tænk “én forretningshændelse”: pris *og* status hører sammen.

## Udtryk — beregn den nye værdi

Du behøver ikke kende den gamle værdi i applikationen:

```sql
UPDATE products
SET price = ROUND(price * 1.10, 2)
WHERE category = 'Drikke';
```

```sql
UPDATE products
SET price = price + 2.00
WHERE category = 'Mad';
```

Højre side af `=` læser **den nuværende** værdi på rækken, før opdateringen gemmes.

## Update med subquery

Når filteret afhænger af andre data:

```sql
-- Alle i samme kategori som Espresso → udsolgt
UPDATE products
SET in_stock = FALSE
WHERE category = (
  SELECT category FROM products WHERE name = 'Espresso'
);
```

Subqueryen er stadig **Read**; `UPDATE` er **Update**. Kombineret giver det kraftige, men læsbare mønstre.

Mere avanceret (kendskab): `UPDATE … FROM …` / join-lignende updates i Postgres. Du klarer dig langt med `WHERE` + subquery.

## Hvad UPDATE *ikke* er

| Handling | Brug i stedet |
|----------|----------------|
| Tilføje ny række | `INSERT` (Create) |
| Fjerne række | `DELETE` (Delete) |
| Ændre tabelstruktur | DDL (`ALTER`) — ikke i MVP |
| “Upsert” (insert eller update) | `INSERT … ON CONFLICT` (senere / avanceret) |

## Constraints under Update

```sql
-- Fejler hvis name sættes til NULL
UPDATE products SET name = NULL WHERE id = 1;

-- Fejler hvis du sætter orders.product_id til et ukendt produkt
UPDATE orders SET product_id = 999 WHERE id = 1;
```

Update skal overholde samme regler som Create.

## RETURNING efter Update

```sql
UPDATE products
SET price = 33.00
WHERE name = 'Latte'
RETURNING id, name, price;
```

API-mønster: returnér den opdaterede ressource til klienten uden ekstra `SELECT`.

## Idempotens — tænk som udvikler

- `UPDATE … SET price = 30 WHERE id = 1` kan køres flere gange → samme sluttilstand (**idempotent**).
- `UPDATE … SET price = price * 1.10 WHERE …` giver **ny** pris hver gang → pas på gentagne kørsler i emulatoren.

Derfor: efter eksperimenter → **Nulstil data**, eller skriv absolutte værdier når du øver dig.

## CRUD i API-sprog

```text
UI: "Ret pris på Latte"
  → API: PATCH /products/{id}
    → SQL: UPDATE products SET price = … WHERE id = …
      RETURNING …
```

Næste lektion: **DELETE** — CRUD Delete og fremmednøgler.

## Prøv selv

1. Preview alle produkter i **`Mad`**.
2. Giv dem **+2.00** i pris med `UPDATE`.
3. Verificér med `SELECT`, og brug gerne `RETURNING`.
