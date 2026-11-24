---
title: 2. INNER JOIN
slug: joins-02-inner
module: joins-subqueries
order: 2
kind: theory
objectives:
  - Skrive INNER JOIN
  - Bruge tabel-aliasser
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.name AS kunde, p.name AS produkt, o.quantity, o.order_date
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    INNER JOIN products p ON p.id = o.product_id
    ORDER BY o.order_date, c.name;
---

# INNER JOIN

Raymond forbinder ordre, kunde og produkt, så en række kan læses som en hel ordrelinje. `INNER JOIN` kombinerer kun rækker, hvor **ON-betingelsen er sand**. Her sammenligner vi FK med PK; INNER JOIN kan også bruge andre betingelser.

> [!RAYMOND:join] Hvem er ikke med på billedet?
>
> Clara har ingen ordrer. En walk-in-ordre har ingen registreret kunde. Forudsig, hvad der sker med begge, når vi kun beholder matches mellem kunder og ordrer.

## Visuelt: hvad overlever?

Vælg **INNER** og se, at Clara (uden ordrer) ikke findes i resultatet. Skift til LEFT for at sammenligne.

```join-viz
types
```

## Syntaks

```sql
SELECT c.name AS kunde, p.name AS produkt, o.quantity
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
INNER JOIN products p ON p.id = o.product_id;
```

## Aliasser

Raymond bruger `o`, `c` og `p` som korte navneskilte på tabellerne. `c.name` og `p.name` er forskellige kolonner, selvom begge hedder name. Et tydeligt alias gør det muligt at følge hvert felt tilbage til sin kilde.

## Filter + JOIN

```sql
SELECT c.name, p.name AS produkt, o.quantity
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
WHERE c.city = 'Viborg'
ORDER BY c.name, p.name;
```

`JOIN` uden `LEFT`, `RIGHT` eller `FULL` betyder `INNER JOIN` i PostgreSQL.

## Linjetotal

```sql
SELECT c.name, p.name, o.quantity, p.price,
       o.quantity * p.price AS linje_total
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
ORDER BY linje_total DESC;
```

> [!RAYMOND:skeptical] Er et gentaget navn en fejl?
>
> En kunde med tre ordrer kan optræde tre gange efter et JOIN. Undersøg først, hvad én resultatrække repræsenterer, før du forsøger at fjerne gentagelser med DISTINCT.

```teach
{
  "question": "I caféens startdata er der 14 ordrer, hvoraf to har et tomt kundenummer. Hvor mange ordrelinjer vil en INNER JOIN til customers bevare?",
  "answer": "Der kommer 12 ordrelinjer. De to walk-in-ordrer mangler et match. En kunde, der har bestilt flere gange, optræder med én række pr. matchende ordre."
}
```

## Prøv selv

Vis alle ordrer med kundenavn og produktnavn for ordrer med `quantity >= 2`.

Følg en kunde med to match i [minicaféens lektion om INNER JOIN](/forloeb/joins/lessons/0001-find-match.html).

Fordybelse i PostgreSQL · [INNER JOIN i PostgreSQL](https://www.postgresql.org/docs/16/tutorial-join.html).
