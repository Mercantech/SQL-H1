---
title: 1. GRANT og REVOKE
slug: advanced-01-grant
module: advanced
order: 1
kind: theory
objectives:
  - Forklare DCL: hvem må hvad
  - Bruge GRANT/REVOKE på tabel og view
  - Skelne ejer, rolle og privilegie
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE VIEW v_public_products AS
    SELECT id, name, category, price FROM products WHERE in_stock = TRUE;
    GRANT SELECT ON v_public_products TO PUBLIC;
    REVOKE ALL ON products FROM PUBLIC;
---

# GRANT og REVOKE

**DCL** (*Data Control Language*) styrer **rettigheder**. I produktion har app-brugeren typisk *ikke* lov til `DROP TABLE` — kun det, den skal bruge.

I SQL-H1 ejer **du** din database. Du kan øve `GRANT`/`REVOKE` på egne objekter. Du må **ikke** oprette cluster-roller (`CREATE ROLE`) her — det er en server-admin-ting.

## Privilegier du skal kende

| Privilegíe | Typisk brug |
|------------|-------------|
| `SELECT` | læse |
| `INSERT` / `UPDATE` / `DELETE` | DML |
| `TRUNCATE` | tøm tabel |
| `REFERENCES` | lave FK til tabellen |
| `TRIGGER` | oprette triggers på tabellen |
| `ALL` | alt ovenstående |

## GRANT på tabel / view

```sql
CREATE OR REPLACE VIEW v_public_products AS
SELECT id, name, category, price
FROM products
WHERE in_stock = TRUE;

-- Alle i databasen må læse viewet (demo)
GRANT SELECT ON v_public_products TO PUBLIC;

-- Fjern bred adgang til rå tabellen (princip)
REVOKE ALL ON products FROM PUBLIC;
```

I en rigtig opsætning ville du `GRANT` til en konkret app-rolle i stedet for `PUBLIC`.

## Kolonne-begrænsning

```sql
GRANT SELECT (id, name, city) ON customers TO PUBLIC;
```

Så kan “andre” ikke læse `email` direkte på tabellen — kombiner med views for endnu klarere API.

## Se rettigheder

```sql
SELECT grantee, privilege_type, table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('products', 'v_public_products')
ORDER BY table_name, grantee, privilege_type;
```

## Least privilege

Tommelfingerregel til projektet:

1. App-rollen må `SELECT`/`INSERT`/`UPDATE` på de tabeller den bruger — ikke `DROP`
2. Rapport-rollen må kun `SELECT` på views
3. Migrations/admin kører med en anden (stærkere) bruger

Det er samme tankegang som Mercantec Auth-roller i API’et — bare inde i Postgres.
