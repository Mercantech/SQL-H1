---
title: Opgave — Udvid caféen med leverandører
slug: ddl-ex-01
module: ddl-er
order: 10
kind: exercise
objectives:
  - CREATE TABLE med PK
  - ALTER TABLE med FK
  - Indeks på FK
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/ddl-ex-01/checks.json
  starterSql: |
    -- Skitsér leverandøren og den kolonne, som skal pege på den.
---

# Opgave — Udvid caféen med leverandører

Tegn først den nye tabel og pilen til den. Forudsig, om et produkt uden leverandør må findes.

Start fra café-seed’en. Udfør trinnene, og tryk **Tjek svar**.

## Krav

1. Opret tabellen **`suppliers`** med:
   - `id SERIAL PRIMARY KEY`
   - `name TEXT NOT NULL`
   - `city TEXT NOT NULL`

2. Tilføj kolonnen **`supplier_id INT`** på **`products`** (må være `NULL`).

3. Tilføj fremmednøglen **`products_supplier_fk`**:  
   `products.supplier_id` → `suppliers(id)`.

4. Opret indekset **`ix_products_supplier`** på `products(supplier_id)`.

5. Indsæt leverandøren **`Nordic Beans`** i byen **`Aarhus`**, og sæt **`Espresso`**.`supplier_id` til den nye leverandørs `id`.

Tip: Brug `RETURNING id` på `INSERT INTO suppliers ...`, eller slå id op med `SELECT`.

Find den nye FK på [Database-siden](/database). Få en makker til at følge Espresso til Nordic Beans og forklare, hvorfor et andet produkt stadig kan have en tom leverandørreference.
