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

Raymond finder en kunde uden e-mail og en ordre uden registreret kunde. Begge bruger **`NULL`**, men betydningen kommer fra modellen: ikke oplyst e-mail eller walk-in-ordre. NULL er ikke det samme som `0`, `''` eller `false`; almindelige sammenligninger med NULL giver **ukendt**.

> [!RAYMOND:curious] Ukendt er ikke det samme som forkert
>
> Hvis jeg ikke kender en e-mail, kan jeg så afgøre, om den er forskellig fra `anna@example.com`? WHERE beholder kun sande betingelser, så både falsk og ukendt bliver sorteret fra.

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
  (o.quantity * p.price) / NULLIF(o.quantity, 0) AS beregnet_stykpris
FROM products p
JOIN orders o ON o.product_id = p.id
LIMIT 5;
```

Her beregner Raymond en stykpris ud fra linjebeløb divideret med antal. `products.price` er allerede caféens stykpris, så regnestykket er kun en demonstration af NULLIF. Hvis antal er 0, bliver nævneren NULL, og resultatet bliver NULL frem for en divisionsfejl. Det erstatter ikke en regel om gyldigt antal.

## IS DISTINCT FROM

Sammenlign inkl. NULL-sikkert:

```sql
-- Tæl rækker med en pris forskellig fra 28.00 (også en eventuel NULL-pris)
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

> [!RAYMOND:skeptical] Har vi erstattet værdien eller forstået den?
>
> COALESCE gør en manglende værdi læselig, mens IS NULL undersøger, om den mangler. Forklar, hvorfor teksten `(ingen e-mail)` i en rapport ikke er dokumentation for, at en kunde faktisk har oplyst en e-mail.

## Café-tip

| Kolonne | NULL betyder |
|---------|--------------|
| `customers.email` | ikke oplyst |
| `orders.customer_id` | walk-in / anonym |
