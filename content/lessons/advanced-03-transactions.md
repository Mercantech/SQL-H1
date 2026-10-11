---
title: 3. Transaktioner — alt eller intet
slug: advanced-03-transactions
module: advanced
order: 3
kind: theory
objectives:
  - Forklare ACID kort
  - Bruge BEGIN/COMMIT/ROLLBACK
  - Se hvorfor API’er pakker flere SQL i én transaktion
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    BEGIN;
    UPDATE products SET price = price + 1 WHERE name = 'Te';
    UPDATE products SET in_stock = FALSE WHERE name = 'Chokoladebolle';
    COMMIT;
    SELECT name, price, in_stock FROM products WHERE name IN ('Te', 'Chokoladebolle');
---

# Transaktioner — alt eller intet

En **transaktion** samler flere SQL-udsagn, så de enten **alle lykkes** (`COMMIT`) eller **ingen af dem** slår igennem (`ROLLBACK`).

## Minimal demo

```sql
BEGIN;
UPDATE products SET price = price + 1 WHERE name = 'Te';
UPDATE products SET in_stock = FALSE WHERE name = 'Chokoladebolle';
COMMIT;
```

Hvis noget fejler midtvejs:

```sql
BEGIN;
UPDATE products SET price = -1 WHERE name = 'Te';  -- kan fejle med CHECK
-- ...
ROLLBACK;
```

## ACID (kort)

| Bogstav | Idé |
|---------|-----|
| **A**tomicity | alt eller intet |
| **C**onsistency | constraints overholdes efter commit |
| **I**solation | samtidige sessioner ser ikke halvfærdige ting |
| **D**urability | efter commit ligger data sikkert |

## Café-scenarie

“Opret ordre” i en API:

1. Tjek produkt på lager  
2. `INSERT` ordre  
3. Eventuelt `UPDATE` lager  

Det skal være **én transaktion** — ellers kan I få ordre uden lager-opdatering ved crash.

## I SQL-H1

I kan øve `BEGIN`/`COMMIT`/`ROLLBACK` i editoren. I C# bruger I typisk `await using var tx = await conn.BeginTransactionAsync()` (ADO.NET) eller et unit-of-work-mønster.

## Isolation (smagsprøve)

Postgres’ default er typisk **READ COMMITTED**. Til eksamen/H1: kend ordet *isolation* og at højere niveauer (`REPEATABLE READ`, `SERIALIZABLE`) findes, når samtidighed bliver kritisk.

### Hvad kan gå galt uden transaktion?

1. Insert ordre OK → crash → lager ikke opdateret  
2. To samtidige køb ser begge “på lager” → overbook  

Transaktioner + evt. `SELECT … FOR UPDATE` (kendskab) er værktøjerne.

## SAVEPOINT (kendskab)

Inde i en transaktion kan I rulle *dele* tilbage:

```sql
BEGIN;
UPDATE products SET price = price + 1 WHERE category = 'Drikke';
SAVEPOINT kun_drikke;
UPDATE products SET price = -1 WHERE name = 'Te';  -- fejler evt.
ROLLBACK TO SAVEPOINT kun_drikke;
COMMIT;
```

## I C# (forhåndsblik)

```csharp
await using var tx = await conn.BeginTransactionAsync();
try {
  // flere commands med transaction: tx
  await tx.CommitAsync();
} catch {
  await tx.RollbackAsync();
  throw;
}
```

## Prøv selv

1. Kør `BEGIN` … to updates … `COMMIT` og verificér.  
2. Gentag med `ROLLBACK` midtvejs — se at intet slog igennem.  
3. Skriv et café-scenarie der *kræver* transaktion (2–3 punkter).
