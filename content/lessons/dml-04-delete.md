---
title: 4. DELETE — Delete i dybden
slug: dml-04-delete
module: dml
order: 4
kind: theory
objectives:
  - Forstå DELETE som CRUD Delete
  - Slette sikkert med WHERE
  - Håndtere fremmednøgler og sletterækkefølge
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    SELECT o.id, c.name AS kunde, p.name AS produkt, o.quantity
    FROM orders o
    LEFT JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    ORDER BY o.id;
---

# DELETE — Delete i dybden

**DELETE** er CRUD-**Delete**: du fjerner *hele rækker*. Kolonner sættes ikke til tomme — rækken er væk.

Mentalt: “Denne kendsgerning skal ikke længere findes.”

## Anatomi

```sql
DELETE FROM tabel
WHERE betingelse;
```

Samme advarsel som ved Update:

```sql
-- FARLIGT: sletter ALLE ordrer
DELETE FROM orders;
```

Altid preview:

```sql
SELECT * FROM orders WHERE quantity = 3;
DELETE FROM orders WHERE quantity = 3;
```

## Delete én række

```sql
DELETE FROM orders WHERE id = 14;
```

Det matcher `DELETE /orders/14` i en API. Primærnøgle er dit sikreste filter.

## Delete mange rækker (bevidst)

```sql
DELETE FROM orders
WHERE order_date < '2024-04-03';
```

Brug det til oprydning, udløbne kladder, test-data — og **dokumentér intentionen** (i virkeligheden: logging, soft-delete, backups).

## Soft delete vs hård delete (teori)

| Strategi | Idé | I SQL-H1 |
|----------|-----|----------|
| **Hård delete** | `DELETE` fjerner rækken | det du øver nu |
| **Soft delete** | `UPDATE … SET deleted_at = now()` | ofte i apps; rækken bliver |

Mange systemer “sletter” med Update (soft delete), så historik bevares. Her træner vi den ægte `DELETE`, fordi constraints og relationer bliver synlige.

## Fremmednøgler — Delete i den rigtige rækkefølge

Caféen: `orders` **peger på** `customers` og `products`.

```sql
-- Typisk FEJL: Anna har stadig ordrer
DELETE FROM customers WHERE name = 'Anna Jensen';
```

Postgres afviser det (FK), så du ikke får “forældreløse” ordrer med ugyldig `customer_id`.

### Mønster: slet børn før forælder

```sql
-- 1) Delete ordrer (børn)
DELETE FROM orders
WHERE customer_id = (
  SELECT id FROM customers WHERE name = 'Anna Jensen'
);

-- 2) Delete kunden (forælder)
DELETE FROM customers WHERE name = 'Anna Jensen';
```

### Alternativer i den “rigtige verden” (kendskab)

- `ON DELETE CASCADE` på FK — sletning af kunde sletter ordrer automatisk (farligt uden design)
- `ON DELETE SET NULL` — ordrer bliver walk-in (`customer_id NULL`) — vi har allerede NULL-tilladelse på `customer_id`
- Forbyd sletning så længe der findes ordrer (det du oplever nu)

I MVP opretter du ikke selv FK-regler (DDL) — men du **skal** forstå dem, når Delete fejler.

## Delete og walk-in-ordrer

Ordrer med `customer_id NULL` har ingen kundemæssig forælder. De kan slettes frit ift. kunder — men de har stadig `product_id` FK til produkter.

```sql
SELECT id, customer_id, product_id
FROM orders
WHERE customer_id IS NULL;

DELETE FROM orders WHERE customer_id IS NULL;
```

## RETURNING ved Delete

```sql
DELETE FROM orders
WHERE quantity >= 3
RETURNING id, customer_id, product_id, quantity;
```

Nyttigt til audit: “hvad forsvandt lige?”

## DELETE vs TRUNCATE (teori)

| | `DELETE` | `TRUNCATE` |
|--|----------|------------|
| Type | DML | mere DDL-agtig / vedligehold |
| `WHERE` | ja | nej (hele tabellen) |
| MV | tilladt (med filter) | typisk forbudt i sandbox |

Brug `DELETE` når du tænker CRUD Delete på udvalgte rækker.

## Fuld CRUD-cirkel i én tanke

```text
Create  INSERT   → ny ordre
Read    SELECT   → se ordren
Update  UPDATE   → ret quantity (hvis I tillader det)
Delete  DELETE   → annullér ordren
```

Øv dig i at **vælge den rigtige kommando** — ikke den du husker bedst.

| Behov | Kommando |
|-------|----------|
| Ny kunde | `INSERT` |
| Se kunder i Viborg | `SELECT` |
| Ret e-mail | `UPDATE` |
| Fjern en test-ordre | `DELETE` |
| “Slet” men behold historik | ofte `UPDATE` (soft delete) |

## Tjekliste før Delete

1. Har jeg `SELECT`’et med samme `WHERE`?
2. Er filteret smalt nok (`id` / tydelig nøgle)?
3. Findes der barn-rækker (ordrer), der blokerer?
4. Skal jeg slette børn først — eller slette noget andet?

## Prøv selv

1. Find ordrer med `quantity = 3` via `SELECT` (join gerne kundenavn).
2. `DELETE` dem med `RETURNING`.
3. Prøv (forstå fejlen) at slette en kunde der stadig har ordrer — og forklar hvorfor.

Når du er tryg ved Create, Read, Update og Delete i SQL, er du klar til DML-opgaverne — og til at genkende CRUD i din fremtidige API.
