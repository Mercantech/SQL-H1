---
title: 2. PROCEDURE vs FUNCTION
slug: procedures-02-procedures
module: procedures
order: 2
kind: theory
objectives:
  - Skelne FUNCTION og PROCEDURE
  - Oprette og kalde en PROCEDURE med CALL
  - Vide hvornår logik hører i DB vs C#
sandbox:
  seed: seeds/shop.sql
  allowWrite: true
  starterSql: |
    CREATE OR REPLACE PROCEDURE restock_product(p_name TEXT)
    LANGUAGE plpgsql
    AS $$
    BEGIN
      UPDATE products SET in_stock = TRUE WHERE name = p_name;
    END;
    $$;
    CALL restock_product('Chokoladebolle');
    SELECT name, in_stock FROM products WHERE name = 'Chokoladebolle';
---

# PROCEDURE vs FUNCTION

Raymond skal åbne caféen igen efter en udsolgt dag. Han vil markere et produkt som på lager og have handlingen kaldt tydeligt. Du hjælper ham med at vælge mellem en funktion og en procedure.

Postgres har både **funktioner** og **procedures**. Raymond bruger især kaldemåden til at holde dem adskilt: en funktion kan indgå i en forespørgsel, mens en procedure kaldes med CALL.

| | `FUNCTION` | `PROCEDURE` |
|--|------------|-------------|
| Kaldes med | `SELECT f(...)` / i udtryk | `CALL p(...)` |
| Returnerer | værdi / tabel | typisk intet (side effects) |
| Brug | beregning, opslag | batch-opgaver, admin-flows |

## PROCEDURE-eksempel

```sql
CREATE OR REPLACE PROCEDURE restock_product(p_name TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET in_stock = TRUE
  WHERE name = p_name;
END;
$$;

CALL restock_product('Chokoladebolle');

SELECT name, in_stock
FROM products
WHERE name = 'Chokoladebolle';
```

## Transaktioner i procedures

> [!RAYMOND:question] Et kald er ikke bevis nok
>
> Hvilken række bør lagerkaldet ændre? Vælg et produkt, kontrollér det før kaldet, og læs det igen bagefter. Overvej også, hvad du kan se, hvis produktnavnet slet ikke findes.

Procedures kan styre `COMMIT`/`ROLLBACK` i nogle scenarier (avanceret). I elev-sandboxen: hold det simpelt — én opgave pr. procedure.

## Hvor skal logikken bo?

| I Postgres (funktion/procedure/trigger) | I C# API |
|----------------------------------------|----------|
| Invariant der *altid* skal gælde | Forretningsflow, HTTP, Auth |
| Genbrug på tværs af klienter | Orkestrering, validering af DTO |
| Tæt på data (ét statement) | Kompleks domænelogik, tests i .NET |

Raymond placerer reglen dér, hvor den kan håndhæves og forklares. En FK hører til i databasen; et flow med HTTP, Auth og beskeder styres i API’et. En procedure er et muligt værktøj til afgrænset databehandling.

## DROP

```sql
DROP PROCEDURE IF EXISTS restock_product(TEXT);
```

## Hvornår PROCEDURE frem for FUNCTION?

| Vælg PROCEDURE når… | Vælg FUNCTION når… |
|---------------------|---------------------|
| Side effects er hovedformålet | I skal bruge resultatet i `SELECT` |
| Batch/admin (“kør natjob”) | Ren beregning / tabel-retur |
| I vil `CALL` eksplicit | Indlejring i SQL-udtryk |

I mange kodebaser lever det meste stadig som **FUNCTION** + app-orchestration. Procedures er nyttige at kende til H1-pensum og Postgres-dokumentation.

## Rettigheder

`GRANT EXECUTE ON FUNCTION/PROCEDURE … TO …` styrer hvem der må kalde. Samme least-privilege-tænkning som ved tabeller.

## Prøv selv

1. Opret `restock_product` og `CALL` den på Chokoladebolle.  
2. Verificér med `SELECT`.  
3. Skriv tre linjer: hvad hører i DB vs. i C# i *jeres* projekt.

> [!RAYMOND:idea-notes] Vælg et formål før et objekt
>
> Forklar, hvorfor lagerhandlingen passer til CALL, og giv et eksempel på en beregning, du hellere vil bruge i SELECT. Vis derefter, hvordan proceduren kan ændres og slettes med sin signatur.
