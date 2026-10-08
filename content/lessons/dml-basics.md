---
title: 1. Introduktion til DML
slug: dml-01-intro
module: dml
order: 1
kind: theory
objectives:
  - Skelne mellem SELECT og DML
  - Kende INSERT, UPDATE og DELETE
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: SELECT * FROM products ORDER BY id;
---

# Introduktion til DML

**DML** (*Data Manipulation Language*) ændrer data:

| Kommando | Gør |
|----------|-----|
| `INSERT` | tilføjer rækker |
| `UPDATE` | ændrer eksisterende rækker |
| `DELETE` | fjerner rækker |

`SELECT` **læser** kun. I dette modul er skrivning tilladt i emulatoren.

## Vigtige vaner

1. Kør `SELECT` **før** du ændrer — se hvad der er der.
2. Brug altid `WHERE` på `UPDATE`/`DELETE`, medmindre du bevidst vil ramme alle rækker.
3. Brug **Nulstil data**, hvis du vil tilbage til udgangspunktet.

## Café-databasen

Du arbejder stadig med `customers`, `products` og `orders`. Fremmednøgler binder ordrer til kunder og produkter — det mærker du især ved `DELETE`.

Næste lektioner går i dybden med hver kommando.
