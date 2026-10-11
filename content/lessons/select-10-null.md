---
title: 10. NULL — tre-værdi-logik
slug: select-10-null
module: select
order: 10
kind: theory
objectives:
  - Forstå at NULL ikke er 0 eller tom streng
  - Bruge IS NULL, COALESCE og NULLIF
  - Undgå fælder i WHERE med NULL
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT name, email,
      COALESCE(email, '(ingen e-mail)') AS email_visning
    FROM customers
    ORDER BY name;
---

# NULL — tre-værdi-logik

I SQL er **`NULL`** “ukendt / mangler” — ikke det samme som `0`, `''` eller `false`. Sammenligninger med `NULL` giver hverken sand eller falsk, men **ukendt**.

## IS NULL / IS NOT NULL

```sql
-- Kunder uden e-mail (Clara i seed)
SELECT name, email
FROM customers
WHERE email IS NULL;

-- Walk-in-ordrer
SELECT id, product_id, quantity, order_date
FROM orders
WHERE customer_id IS NULL;
```

**Forkert** (finder typisk *ingen* rækker):

```sql
SELECT * FROM customers WHERE email = NULL;  -- virker ikke som du tror
```

## COALESCE — første ikke-NULL

```sql
SELECT
  name,
  COALESCE(email, '(ingen e-mail)') AS email_visning
FROM customers
ORDER BY name;
```

Flere niveauer:

```sql
SELECT COALESCE(email, name, 'ukendt') AS kontakt
FROM customers;
```

## NULLIF

`NULLIF(a, b)` returnerer `NULL` hvis `a = b`, ellers `a`. Nyttigt til at undgå division med 0:

```sql
SELECT
  name,
  price,
  quantity,
  price / NULLIF(quantity, 0) AS pris_pr_stk_paa_ordre
FROM products p
JOIN orders o ON o.product_id = p.id
LIMIT 5;
```

## IS DISTINCT FROM

Sammenlign inkl. NULL-sikkert:

```sql
-- true hvis værdierne er forskellige (NULL tæller med)
SELECT COUNT(*) AS ændret
FROM products
WHERE price IS DISTINCT FROM 28.00;
```

## WHERE og tre-værdi-logik

```sql
-- Kun rækker hvor udtrykket er SAND
SELECT * FROM customers WHERE city = 'Viborg' OR email IS NULL;
```

En række, hvor betingelsen er **ukendt**, filtreres fra — derfor skal du eksplicit håndtere NULL, når kolonnen kan mangle.

## Café-tip

| Kolonne | NULL betyder |
|---------|--------------|
| `customers.email` | ikke oplyst |
| `orders.customer_id` | walk-in / anonym |
