---
title: Opgave — SQL som jeres ADO.NET-DAL
slug: adonet-ex-01
module: adonet
order: 10
kind: exercise
objectives:
  - Skrive den SQL en NpgsqlCommand ville køre
  - INSERT … RETURNING + læse med JOIN
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/adonet-ex-01/checks.json
  starterSql: |
    INSERT INTO customers (name, city, email)
    VALUES ('DAL Demo', 'Viborg', 'dal@example.com')
    RETURNING id;
---

# Opgave — SQL som jeres ADO.NET-DAL

Forestil dig to methods: `CreateCustomerAsync` og `GetCustomerOrdersAsync`. Implementér **SQL-delen** her.

## Del 1

Indsæt kunden **`DAL Demo`** i **Viborg** med e-mail **`dal@example.com`** (som `RETURNING id` i rigtig C#).

## Del 2

Indsæt en ordre for den kunde: produkt **Espresso** (`product_id` for Espresso), `quantity = 2`, `order_date = DATE '2024-05-01'`.

## Del 3

Skriv en forespørgsel der for kunden **DAL Demo** returnerer `kunde`, `produkt`, `quantity`, `order_date` (JOIN), sorteret på `order_date`.  
(Checks verificerer at ordren findes via JOIN.)
