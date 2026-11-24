---
title: Opgave B — updated_at trigger
slug: triggers-ex-02
module: triggers
order: 11
kind: exercise
objectives:
  - BEFORE UPDATE trigger
  - Sæt NEW.updated_at
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/triggers-ex-02/checks.json
  starterSql: |
    ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
---

# Opgave B — updated_at trigger

## Krav

1. Tilføj kolonnen **`updated_at TIMESTAMPTZ`** på `products` (hvis den mangler).

2. Opret funktionen **`touch_updated_at`** der sætter `NEW.updated_at := now()` og returnerer `NEW`.

3. Opret triggeren **`trg_products_touch`**: `BEFORE UPDATE ON products FOR EACH ROW`.

4. Kør en `UPDATE` på mindst ét produkt, så `updated_at` bliver sat.

Forudsig hvad en ekstra UPDATE med et gammelt tidsstempel vil efterlade. Kontrollen prøver ændringen, aflæser den gemte værdi og ruller sit forsøg tilbage. Kontrollér selv at din trigger kører pr. række.
