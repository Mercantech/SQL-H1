---
title: Opgave B — Lookup-tabel categories
slug: ddl-ex-02
module: ddl-er
order: 11
kind: exercise
objectives:
  - CREATE TABLE med UNIQUE
  - Migrere tekst-kategori til FK
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/ddl-ex-02/checks.json
  starterSql: |
    -- Design kategoriens nøgle, inden du forbinder produkterne.
---

# Opgave B — Lookup-tabel categories

Tre fælles kategorier skal erstatte gentaget tekst som forbindelse. Forudsig først, hvor mange kategorirækker og hvor mange produktrækker du skal ændre i caféens startdata.

## Krav

1. Opret **`categories`** med `id SERIAL PRIMARY KEY` og `name TEXT NOT NULL UNIQUE`.

2. Indsæt kategorierne **`Drikke`**, **`Bagværk`** og **`Mad`** (præcis stavning).

3. Tilføj **`category_id INT`** på `products`.

4. Tilføj FK **`products_category_fk`**: `products.category_id` → `categories(id)`.

5. Opdatér alle produkter, så `category_id` matcher deres nuværende `category`-tekst.

Kontrollér hver kategori ved at sammenligne produktets oprindelige tekst med kategorinavnet via din FK. Om en uge kan du genskabe samme model i [Relationsmodulets designøvelse](/learn/relations-05-design-patterns).
