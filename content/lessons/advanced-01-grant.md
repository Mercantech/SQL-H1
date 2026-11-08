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

Raymond skal give caféens menuskærm læseadgang, mens en anden rolle vedligeholder data. **DCL** (*Data Control Language*) hjælper ham med at give de nødvendige rettigheder. At kunne vise menuen kræver ikke ejerskab over tabellerne.

I SQL-H1 ejer **du** din database. Du kan øve `GRANT`/`REVOKE` på egne objekter. Du må **ikke** oprette cluster-roller (`CREATE ROLE`) her — det er en server-admin-ting.

> [!RAYMOND:safe-lock] Hvem skal kunne hvad?
>
> Skriv én handling til menurollen og én til vedligeholdelsesrollen. Giv derefter rettigheder til disse behov. Appens loginroller fra Mercantec Auth og PostgreSQLs databaseroller er to forskellige lag, selv om begge bruges til at begrænse adgang.

## Privilegier du skal kende

| Privilegie | Typisk brug |
|------------|-------------|
| `SELECT` | læse |
| `INSERT` / `UPDATE` / `DELETE` | DML |
| `TRUNCATE` | tøm tabel |
| `REFERENCES` | lave FK til tabellen |
| `TRIGGER` | oprette triggers på tabellen |
| `ALL` | alle relevante grantbare privilegier på det valgte objekt; ikke ejerskab |

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

I en rigtig opsætning ville Raymond bruge en konkret app-rolle. `PUBLIC` omfatter alle roller, også fremtidige; eksemplet er afgrænset til øvelsen. Retten til eksempelvis `DROP` følger ejerskab og er ikke et ekstra tabelprivilegie, som `GRANT ALL` uddeler.

## Kolonne-begrænsning

```sql
GRANT SELECT (id, name, city) ON customers TO PUBLIC;
```

Det giver læserettighed til netop disse kolonner. Det fjerner ikke et andet, bredere `SELECT`, som rollen allerede kan have direkte, gennem medlemskab eller via `PUBLIC`. Raymond kontrollerer alle de relevante adgangsveje.

## Se rettigheder

```sql
SELECT grantee, privilege_type, table_name
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('products', 'v_public_products')
ORDER BY table_name, grantee, privilege_type;
```

> [!RAYMOND:skeptical] Min egen SELECT beviser ikke begrænsningen
>
> Som ejer kan du stadig læse dine objekter efter et `REVOKE ... FROM PUBLIC`. Undersøg grant-oplysningerne her; afprøv de faktiske tilladelser med en separat begrænset rolle i en lokal lab.

## Least privilege

Tommelfingerregel til projektet:

1. App-rollen må `SELECT`/`INSERT`/`UPDATE` på de tabeller den bruger — ikke `DROP`
2. Rapport-rollen må kun `SELECT` på views
3. Migrations/admin kører med en anden (stærkere) bruger

Mercantec Auth afgør brugerens identitet og API-adgang; appens databaseforbindelse bruger en PostgreSQL-rolle. Hold de to ansvarsområder adskilt, og begræns begge efter deres opgave.

## GRANT på views (anbefalet mønster)

```sql
CREATE OR REPLACE VIEW v_menu AS
SELECT name, category, price FROM products WHERE in_stock = TRUE;

GRANT SELECT ON v_menu TO PUBLIC;
-- I produktion: GRANT SELECT ON v_menu TO app_readonly;
```

Kombinér med `REVOKE` på basistabeller for rigtig least privilege (kræver separate roller — **cluster-roller** opretter I ikke i SQL-H1-sandboxen; det viser underviseren / I gør det i jeres Compose-setup).

## Hvad I *ikke* kan i elev-sandboxen

Blokeret af sikkerhedshensyn: `CREATE ROLE`, `CREATE DATABASE`, m.m. I øver `GRANT`/`REVOKE` på **egne objekter** (fx `TO PUBLIC`).

## Default privileges (kendskab)

I team-databaser sætter man ofte `ALTER DEFAULT PRIVILEGES`, så nye tabeller automatisk får rigtige GRANT til app-rollen. Nævn det i driftsdokumentationen.

## Prøv selv

1. Opret et view og `GRANT SELECT … TO PUBLIC`.  
2. Kør `table_privileges`-forespørgslen og find jeres grant til `PUBLIC`.
3. `REVOKE` igen og se forskellen.

> [!RAYMOND:reading] Vis både tildeling og fjernelse
>
> Gem oversigten før og efter `REVOKE`, og forklar præcis hvilken adgang du ændrede. `table_privileges` kan vise `PUBLIC`-grants, mens `role_table_grants` udelader dem. Beskriv også, hvad du endnu ikke har testet med din ejerrolle.

Kilde: [PostgreSQLs oversigt over grants til aktive roller og PUBLIC](https://www.postgresql.org/docs/16/infoschema-role-table-grants.html).
