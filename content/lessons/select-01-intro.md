---
title: 1. Velkommen til SELECT
slug: select-01-intro
module: select
order: 1
kind: theory
objectives:
  - Forstå hvad en forespørgsel er
  - Kende café-databasens tabeller
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: "SELECT * FROM customers;"
---

# Velkommen til SELECT

I dette modul lærer du at hente data med `SELECT`. Du arbejder i en lille **café-database** med tre tabeller:

| Tabel | Indhold |
|-------|---------|
| `customers` | Kunder (navn, by, e-mail) |
| `products` | Produkter (navn, kategori, pris) |
| `orders` | Ordrer (kunde, produkt, antal, dato) |

## Din første forespørgsel

```sql
SELECT * FROM customers;
```

- `SELECT` = hvad du vil have ud
- `*` = alle kolonner
- `FROM customers` = hvilken tabel

Kør SQL’en i panelet til højre. Prøv også `products` og `orders`.

## Tip

Brug `SELECT *` til at **udforske** en tabel. Når du kender kolonnerne, vælger du dem eksplicit — det er klarere og hurtigere.
