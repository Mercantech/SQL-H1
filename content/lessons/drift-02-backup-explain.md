---
title: 2. Backup, indeks og EXPLAIN
slug: drift-02-backup-explain
module: drift
order: 2
kind: theory
objectives:
  - Kende pg_dump / restore som driftsværktøj
  - Bruge indeks bevidst
  - Læse EXPLAIN ift. performance
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE INDEX IF NOT EXISTS ix_orders_date ON orders (order_date);
    EXPLAIN SELECT * FROM orders WHERE order_date >= DATE '2024-04-01';
---

# Backup, indeks og EXPLAIN

## Backup og restore (værktøj uden for editoren)

I produktion tager man kopi af databasen — ikke “håber på det bedste”.

| Værktøj | Brug |
|---------|------|
| `pg_dump` | eksporter schema + data til fil |
| `pg_restore` / `psql` | læs dump ind igen |
| Volumes i Docker | disk, der overlever container-genstart |

Typisk lokalt (på host, ikke i elev-SQL):

```bash
pg_dump -h localhost -U sqlh1 -d min_db -f backup.sql
psql -h localhost -U sqlh1 -d min_db -f backup.sql
```

I SQL-H1 er **Nulstil database** jeres “genindlæs seed” — ikke en erstatning for rigtig backup, men samme idé: kendt starttilstand.

`COPY ... TO/FROM` fil er **blokeret** i sandboxen (filadgang på serveren). I Docker/admin kan I stadig bruge `pg_dump`.

## Indeks i drift

```sql
CREATE INDEX IF NOT EXISTS ix_orders_date ON orders (order_date);

EXPLAIN
SELECT * FROM orders
WHERE order_date >= DATE '2024-04-01';
```

Kig efter `Index Scan` / `Bitmap Heap Scan` vs `Seq Scan`. På små café-tabeller vælger planneren ofte seq scan alligevel — det er OK. Pointen er at **kunne læse planen**.

```sql
EXPLAIN ANALYZE
SELECT c.city, COUNT(*) 
FROM orders o
JOIN customers c ON c.id = o.customer_id
GROUP BY c.city;
```

## Vedligehold (smagsprøve)

```sql
ANALYZE orders;
ANALYZE products;
```

`ANALYZE` opdaterer statistik, så planneren vælger bedre planer. `VACUUM` rydder døde tupler — mere relevant i langlivede prod-DB’er.

## Checkliste til projektet

1. Har FK-kolonner indeks?
2. Kan I genskabe DB fra seed/migration + dump?
3. Ved I, hvilken connection string Docker Compose bruger?
