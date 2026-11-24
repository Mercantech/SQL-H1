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
    -- Kør din INSERT til kunden, før du opretter kundens ordre.
---

# Opgave — SQL som jeres ADO.NET-DAL

Forestil dig to methods: `CreateCustomerAsync` og `GetCustomerOrdersAsync`. Implementér **SQL-delen** her.

## Del 1

Indsæt kunden **`DAL Demo`** i **Viborg** med e-mail **`dal@example.com`** (som `RETURNING id` i rigtig C#).

## Del 2

Indsæt en ordre for den kunde: produkt **Espresso** (`product_id` for Espresso), `quantity = 2`, `order_date = DATE '2024-05-01'`.

## Del 3

Skriv en forespørgsel der for kunden **DAL Demo** returnerer `kunde`, `produkt`, `quantity`, `order_date` (JOIN), sorteret på `order_date`.

Kør de to skrivninger i SQL-editoren. Aflever din egen SELECT til del 3 i svarfeltet. Brug kolonnenavnene `kunde`, `produkt`, `quantity`, `order_date`; datoen for ordren er `2024-05-01`. Genbesøg [C#-kundelisten](/learn/adonet-02-command-reader), og vis hvor en manglende e-mail bliver til `null`.
