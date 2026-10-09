---
title: 4. Database-design og normalisering
slug: relations-04-normalization
module: relations
order: 4
kind: theory
objectives:
  - Forklare formålet med database-design
  - Anvende 1NF, 2NF og 3NF på café-eksempler
  - Genkende opdaterings-, indsættelses- og sletteanomalier
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.name AS kunde, c.city, p.name AS produkt, p.price, o.quantity, o.order_date
    FROM orders o
    JOIN customers c ON c.id = o.customer_id
    JOIN products p ON p.id = o.product_id
    ORDER BY o.order_date, c.name
    LIMIT 12;
---

# Database-design og normalisering

**Database-design** er kunsten at vælge *hvilke tabeller*, *hvilke kolonner* og *hvordan de hænger sammen*, før (eller mens) du skriver SQL. Et godt design gør CRUD, JOIN og constraints enkle — et dårligt design giver dubletter, inkonsistens og smertefulde `UPDATE`/`DELETE`.

Café-skemaet (`customers`, `products`, `orders`) er allerede **normaliseret**. Her lærer du *hvorfor*.

## Hvad prøver vi at undgå?

Hvis alt lå i **én flad “Excel-tabel”**, kunne en “ordre-linje” se sådan ud:

| kunde | by | produkt | pris | antal | dato |
|-------|-----|---------|------|-------|------|
| Anna Jensen | Viborg | Espresso | 28 | 2 | 2024-04-01 |
| Anna Jensen | Viborg | Croissant | 22.50 | 1 | 2024-04-02 |
| Bo Nielsen | Aarhus | Latte | 35 | 1 | 2024-04-02 |

Du kan *simulere* den flade verden med et JOIN (data er stadig normaliseret under motorhjelmen):

```sql
SELECT c.name AS kunde, c.city, p.name AS produkt, p.price, o.quantity, o.order_date
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
ORDER BY o.order_date, c.name
LIMIT 12;
```

Læg mærke til **redundans**: Annas by gentages; Espressos pris gentages på hver linje. Det er udgangspunktet for normalisering.

## Tre klassiske anomalier

| Anomali | Problem i den flade tabel |
|---------|---------------------------|
| **Opdateringsanomali** | Anna flytter til Randers — du skal huske at rette *alle* hendes linjer. Glemmer du én, lyver data. |
| **Indsættelsesanomali** | Du vil registrere et nyt produkt *før* nogen har købt det — men “pris” findes kun på ordrelinjer. |
| **Sletteanomali** | Sidste ordre med “Chokoladebolle” slettes — produktets pris/historik forsvinder med. |

Normalisering splitter data, så hver kendsgerning gemmes **ét sted**.

## Normalformer (det du skal kunne)

Vi fokuserer på **1NF → 2NF → 3NF**. (Der findes BCNF, 4NF, … — kendskab; 3NF er arbejdshorse i praksis.)

### 1NF — First Normal Form

**Regel (praktisk):**

1. Hver celle har **én værdi** (ikke lister i en celle).
2. Hver række er unik (har en nøgle).
3. Ingen gentagne kolonnegrupper (`produkt1`, `produkt2`, …).

**Dårligt (bryder 1NF):**

| ordre_id | kunde | produkter |
|----------|-------|-----------|
| 1 | Anna | Espresso, Croissant |

**Bedre:** én række pr. ordrelinje (som vores `orders` — forenklet linje-model).

```sql
-- Én værdi pr. celle, én linje pr. køb
SELECT o.id, c.name, p.name, o.quantity
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
WHERE c.name = 'Anna Jensen'
ORDER BY o.id;
```

### 2NF — Second Normal Form

**Forudsætter 1NF.**  
**Regel:** Ingen ikke-nøgle-kolonne må afhænge af kun *en del* af en sammensat nøgle.

Klassisk fejl: ordrelinje med nøgle `(ordre_id, produkt_id)` og kolonnen `kundenavn` — kundenavn afhænger kun af ordren/kunden, ikke af produktet.

**I caféen:** kundenavn og by bor i `customers`, ikke gentaget på hver `orders`-række. Pris og produktnavn bor i `products`.

```sql
-- orders gemmer ID'er — ikke navne/priser
SELECT id, customer_id, product_id, quantity, order_date
FROM orders
ORDER BY id
LIMIT 8;
```

### 3NF — Third Normal Form

**Forudsætter 2NF.**  
**Regel:** Ingen ikke-nøgle-kolonne må afhænge af en *anden* ikke-nøgle-kolonne (ingen “transitativ” afhængighed).

**Dårligt eksempel:**

| produkt_id | name | category | category_manager |
|------------|------|----------|------------------|
| 1 | Espresso | Drikke | Mia |

`category_manager` afhænger af `category`, ikke af produktet. Rettes Mia’s titel, skal mange rækker opdateres.

**Bedre (mønster):** egen `categories`-tabel (lookup) — se næste lektion om designmønstre. I vores seed er `category` en simpel tekst på `products` (pragmatisk 3NF-light til undervisning).

## Fra fladt ark til café-design

| Kendsgerning | Hører hjemme i |
|--------------|----------------|
| Kundens navn og by | `customers` |
| Produktets navn, kategori, pris | `products` |
| At en kunde købte et produkt (antal, dato) | `orders` |

```text
customers (1) ──< orders >── (1) products
```

Det er **normaliseret 1:n / n:1** via en koblingstabel (`orders`).

## Normalisering vs. denormalisering

| | Normaliseret | Denormaliseret |
|--|--------------|----------------|
| Mål | én sandhed, få anomalier | færre JOIN, hurtigere læsning |
| Typisk | OLTP (daglig CRUD) | rapporter, data warehouse, cache |
| Risiko | flere JOIN | inkonsistens ved opdatering |

I SQL-H1 designer vi til **OLTP-undervisning**: sandhed først. Senere kan man *bevidst* denormalisere til reports — aldrig af uvidenhed.

## Designproces (mini-opskrift)

1. Find **substantiver** i forretningen (kunde, produkt, ordre).
2. Find **relationer** (1:n, n:n).
3. Vælg **nøgler** (surrogat `id` er ok og almindeligt).
4. Placér hvert attribut dér, hvor det **afhænger af nøglen**.
5. Tjek 1NF → 2NF → 3NF med anomalierne i baghovedet.
6. Tegn E/R (se også Database-siden) og verificér med `SELECT`/`JOIN`.

## Prøv selv

1. Kør den flade `SELECT` øverst. Peg på tre steder med **redundans**.
2. Forklar med egne ord: hvad sker der ved opdateringsanomali, hvis Annas by kun fandtes på ordrelinjer?
3. Argumentér for, hvorfor `price` ligger på `products` og ikke på `orders` i vores seed (tip: prisændring vs. historisk linjepris — begge designs findes; kend trade-off).

Næste lektion: **designmønstre** (lookup, koblingstabel, soft delete, stjerne m.m.).
