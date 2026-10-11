---
title: 4. Drifts-checkliste til projektet
slug: drift-04-checklist
module: drift
order: 4
kind: theory
objectives:
  - Samle metadata, backup, indeks og Compose
  - Kunne svare på drifts-spørgsmål til aflevering
  - Skelne elev-sandbox fra prod
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS tabeller,
      (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') AS indeks,
      current_database() AS database;
---

# Drifts-checkliste til projektet

Brug denne side som **mundtlig/skriftlig tjekliste** før I afleverer database-delen.

## 1) Hvad kører hvor?

- [ ] Postgres-service i Compose har navn og image (`postgres:16` …)
- [ ] Data ligger i et **volume** (ikke kun container-filesystem)
- [ ] API får connection string via **env** (ikke hardcodet password i git)
- [ ] Browser rammer API via `/api` — ikke DB-porten direkte

## 2) Skema og seed

- [ ] I kan genskabe skema (migration eller SQL-script)
- [ ] I har start-data (seed) til demo
- [ ] I ved forskel på *elev-sandbox i SQL-H1* og *jeres projekt-DB*

## 3) Performance-minimum

- [ ] FK-kolonner har indeks (eller I kan forklare hvorfor ikke)
- [ ] I har kørt `EXPLAIN` på mindst én tung forespørgsel
- [ ] I undgår `SELECT *` i API-hotpaths uden grund

## 4) Sikkerhed

- [ ] App-rollen har least privilege (ikke superuser i prod)
- [ ] SQL fra brugere går via **parametre** (ADO.NET/Dapper)
- [ ] Backup-plan er nævnt (`pg_dump` / volume-backup)

## Hurtig status i SQL

```sql
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS tabeller,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') AS indeks,
  current_database() AS database;
```
