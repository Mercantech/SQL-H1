---
title: Opgaver — DML
module: dml
order: 10
kind: exercise
objectives:
  - Indsætte, opdatere og slette data
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  checks: exercises/dml-01/checks.json
  starterSql: -- Indsæt en ny kunde 'Eva Møller' i Aarhus
INSERT INTO customers (name, city) VALUES ('Eva Møller', 'Aarhus');
---

# Opgaver — DML

Udgangspunktet er café-databasen. Udfør ændringerne nedenfor, og tryk **Tjek svar**.

1. Indsæt kunden **Eva Møller** i byen **Aarhus**.
2. Sæt prisen på **Te** til **27.00**.
3. Slet ordren med `id = 8`.

Tip: Brug `SELECT` undervejs for at kontrollere dine ændringer.
