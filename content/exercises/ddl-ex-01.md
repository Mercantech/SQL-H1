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
    -- 1) Opret suppliers
    -- 2) Tilføj products.supplier_id + FK
    -- 3) Indeks på supplier_id
---

# Opgave — Udvid caféen med leverandører

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
