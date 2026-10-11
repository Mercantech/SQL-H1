---
title: Opgave — Pris-audit med trigger
slug: triggers-ex-01
module: triggers
order: 10
kind: exercise
objectives:
  - Audit-tabel
  - Trigger-funktion + CREATE TRIGGER
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/triggers-ex-01/checks.json
  starterSql: |
    CREATE TABLE IF NOT EXISTS product_audit (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL,
      old_price NUMERIC(10,2),
      new_price NUMERIC(10,2),
      changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
---

# Opgave — Pris-audit med trigger

## Krav

1. Opret tabellen **`product_audit`** med kolonnerne:  
   `id SERIAL PRIMARY KEY`, `product_id INT NOT NULL`, `old_price NUMERIC(10,2)`, `new_price NUMERIC(10,2)`, `changed_at TIMESTAMPTZ NOT NULL DEFAULT now()`.

2. Opret trigger-funktionen **`log_product_price_change`**, der ved prisændring indsætter en række i `product_audit`.

3. Opret triggeren **`trg_product_price`**: `AFTER UPDATE ON products FOR EACH ROW`.

4. Kør: `UPDATE products SET price = 30.00 WHERE name = 'Espresso';`  
   (så check kan se en audit-række)

Tryk **Tjek svar**.
