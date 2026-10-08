---
title: 2. 1:1, 1:n og n:n
slug: relations-02-cardinalitet
module: relations
order: 2
kind: theory
objectives:
  - Forklare kardinalitet
  - Genkende 1:n i café-modellen
sandbox:
  seed: seeds/shop.sql
  allowWrite: false
  starterSql: |
    SELECT c.name, COUNT(o.id) AS antal_ordrer
    FROM customers c
    LEFT JOIN orders o ON o.customer_id = c.id
    GROUP BY c.name
    ORDER BY antal_ordrer DESC, c.name;
---

# 1:1, 1:n og n:n

## 1:n (én-til-mange)

Én kunde kan have **mange** ordrer. Hver ordre har **én** kunde.

```sql
SELECT c.name, COUNT(o.id) AS antal_ordrer
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
ORDER BY antal_ordrer DESC;
```

Samme mønster: ét produkt → mange ordrelinjer.

## n:n (mange-til-mange)

Kunder og produkter er n:n: en kunde køber mange produkter, et produkt købes af mange kunder.  
**Koblingstabellen** er `orders` (i en webshop ofte `order_lines`).

## 1:1

Sjældnere: fx `customers` og `customer_profiles` med samme PK. Findes ikke i café-seed’en, men princippet er “højst én række i hver tabel”.

## Prøv selv

Vis hvor mange **forskellige** produkter hver kunde har købt (`COUNT(DISTINCT product_id)`).
