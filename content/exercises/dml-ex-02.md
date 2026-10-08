---
title: Opgave B — Flere INSERT/UPDATE
slug: dml-ex-02
module: dml
order: 11
kind: exercise
objectives:
  - Multi-row INSERT
  - UPDATE med udtryk
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/dml-ex-02/checks.json
  starterSql: |
    INSERT INTO products (name, category, price, in_stock) VALUES
      ('Kakao', 'Drikke', 32.00, TRUE);
---

# Opgave B — Flere INSERT/UPDATE

## Del 1

Indsæt produktet **Kakao** (`Drikke`, pris `32.00`, `in_stock = TRUE`).

## Del 2

Indsæt kunden **Ida Ravn** i **Odense** med e-mail **`ida@example.com`**.

## Del 3

Forhøj prisen på **alle Bagværk** med **1.50** (brug `price = price + 1.50`).
