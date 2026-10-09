---
title: 5. Designmønstre til databaser
slug: relations-05-design-patterns
module: relations
order: 5
kind: theory
objectives:
  - Genkende og vælge almindelige skema-mønstre
  - Modellere n:n med koblingstabel
  - Kende pragmatiske mønstre (lookup, soft delete, audit)
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT p.category, COUNT(*) AS antal_produkter, ROUND(AVG(p.price), 2) AS snitpris
    FROM products p
    GROUP BY p.category
    ORDER BY p.category;
---

# Designmønstre til databaser

Normalisering siger *hvor data hører hjemme*. **Designmønstre** er genbrugelige måder at bygge skemaet på — som “opskrifter”, du genkender i næsten alle forretningssystemer.

## 1) Surrogatnøgle (`id`)

**Mønster:** Hver tabel får et teknisk `SERIAL`/`IDENTITY`-id som PK.

```sql
SELECT id, name FROM customers ORDER BY id LIMIT 5;
```

| Fordele | Ulemper |
|---------|---------|
| Stabilt, kort, nemt i FK | siger intet forretningsmæssigt |
| Undgår sammensatte nøgler overalt | kan skjule naturlige unikheder (brug `UNIQUE` ekstra) |

Caféen bruger surrogater overalt — standard i .NET/Postgres-apps.

## 2) Lookup / reference-tabel

**Problem:** `products.category` er fri tekst → stavefejl (“Drikke” vs “drikke”).

**Mønster:** egen tabel `categories (id, name)` og `products.category_id → categories.id`.

I seed’et er kategorier stadig tekst (simpelt til undervisning). Du kan *se* grupperingen:

```sql
SELECT p.category, COUNT(*) AS antal_produkter, ROUND(AVG(p.price), 2) AS snitpris
FROM products p
GROUP BY p.category
ORDER BY p.category;
```

Når systemet vokser: løft `category` til lookup (3NF + konsistens).

## 3) Koblingstabel til n:n

**Problem:** kunder ↔ produkter er mange-til-mange.

**Mønster:** en tabel i midten — hos os `orders` (forenklet: én linje = ét produkt). I større systemer:

```text
orders (hoved) 1──< order_lines >── products
```

| Tabel | Indeholder |
|-------|------------|
| `orders` | hvem, hvornår, status |
| `order_lines` | produkt, antal, linjepris |

Vores MVP har “flatet” linjen ind i `orders` — godt til læring; i produktion splitter man ofte hoved + linjer.

```sql
-- n:n via orders: hvilke produkter har Anna købt?
SELECT DISTINCT p.name
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
WHERE c.name = 'Anna Jensen'
ORDER BY p.name;
```

## 4) 1:1-udvidelse (extension-tabel)

**Mønster:** kerne i `customers`, sjældne/tunge felter i `customer_profiles` med samme PK/FK 1:1.

Bruges når:

- ikke alle kunder har profil
- store JSON/dokument-felter
- separat sikkerhed/adgang

Caféen har ikke 1:1 endnu — men kardinaliteten kender du fra lektion 2.

## 5) Hierarki / self-reference

**Mønster:** `employees.manager_id → employees.id` (træ).

```sql
-- Mønster-illustration med kunder i samme by (ikke ægte hierarki)
SELECT a.name AS kunde_a, b.name AS kunde_b, a.city
FROM customers a
JOIN customers b ON a.city = b.city AND a.id < b.id
ORDER BY a.city, a.name;
```

Ægte org-hierarkier, kategoritræer (`parent_id`) og mappe-strukturer følger samme idé.

## 6) Soft delete

**Mønster:** slet ikke rækken — sæt `deleted_at` / `is_active = FALSE`.

```sql
-- "Udfas" i stedet for DELETE (status-mønster)
SELECT id, name, in_stock
FROM products
WHERE in_stock = FALSE;
```

`in_stock` er et lille søskende til soft delete: historik og FK overlever. Kombineres ofte med `ON DELETE RESTRICT`.

## 7) Audit-kolonner

**Mønster:** `created_at`, `updated_at`, `created_by`, …

```sql
SELECT id, name, created_at
FROM customers
ORDER BY created_at, id;
```

Gør support, debugging og GDPR-sporbarhed lettere. I API’er sættes de ofte i applikationslaget eller via triggers.

## 8) Historisk pris på linjen (snapshot)

**Trade-off fra normalisering:**

- **Kun `products.price`:** prisændring ændrer “historikken” semantisk, hvis du joiner bagud.
- **Snapshot:** `orders.unit_price` gemmer prisen *på købstidspunktet*.

Café-seed’et joiner nutidens pris:

```sql
SELECT c.name, p.name, o.quantity, p.price,
       o.quantity * p.price AS linje_nu
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
ORDER BY o.id
LIMIT 8;
```

I et rigtigt kassesystem: gem **linjepris** på ordren (bevidst denormalisering / snapshot-mønster).

## 9) Stjerne vs. snefnug (analytisk — kendskab)

| Mønster | Idé | Brug |
|---------|-----|------|
| **Star** | faktatabel + denormaliserede dimensioner | BI, data warehouse |
| **Snowflake** | dimensioner normaliseret yderligere | mere 3NF i warehouse |

OLTP (det du bygger i SQL-H1) ≈ normaliserede 3NF-tabeller.  
OLAP/rapporter ≈ stjerne med færre JOIN.

## 10) Walk-in / valgfri FK

**Mønster:** FK må være `NULL` = “ingen forælder”.

```sql
SELECT id, customer_id, product_id, quantity
FROM orders
WHERE customer_id IS NULL;
```

Matcher `ON DELETE SET NULL` og anonymisering — du så det i DML-cascading-lektionen.

## Sådan vælger du mønster

| Spørgsmål | Peger på |
|-----------|----------|
| Gentages samme tekst overalt? | Lookup |
| Er relationen n:n? | Koblingstabel |
| Skal historik overleve sletning? | Soft delete / RESTRICT |
| Skal gamle ordrer huske prisen? | Snapshot-kolonne |
| Er feltet sjældent / tungt? | 1:1-extension |
| Er det et træ? | Self-FK |

## Caféen som mønsterkatalog

| Element | Mønster |
|---------|---------|
| `id`-kolonner | Surrogat-PK |
| `orders` mellem kunde og produkt | Kobling / faktalinje |
| `category` tekst | Lookup-kandidat |
| `in_stock` | Status / soft-udfasing |
| `created_at` | Audit |
| `customer_id NULL` | Valgfri FK / walk-in |

## Prøv selv

1. Foreslå en `categories`-tabel (kolonner + FK fra `products`) — skriv den som skitse i en kommentar eller på papir.
2. Skitsér `order_lines` adskilt fra `orders` (hvilke kolonner flytter hvorhen?).
3. Argumentér: hvornår vil du gemme `unit_price` på ordren i stedet for kun at joine `products.price`?

Du kan nu både **normalisere** og **genkende mønstre** — det er kernen i database-design, før du senere får lov til fuld DDL/`CREATE TABLE`.
