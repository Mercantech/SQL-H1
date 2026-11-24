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
    -- Find de oprindelige priser for bagværk før ændringen.
---

# Opgave B — Flere INSERT/UPDATE

Regn de to nye bagværkspriser ud på papir, før du kører din opdatering. Brug dem som kontrol bagefter.

## Del 1

Indsæt produktet **Kakao** (`Drikke`, pris `32.00`, `in_stock = TRUE`).

## Del 2

Indsæt kunden **Ida Ravn** i **Odense** med e-mail **`ida@example.com`**.

## Del 3

Forhøj prisen på **alle Bagværk** med **1.50** (brug `price = price + 1.50`).

Hvis prisen er steget 3.00, hvilken kommando er så kørt to gange? Forklar, hvordan du vil opdage det med en SELECT, før du ændrer noget igen.
