# Rettigheder, parametre og transaktioner

Brug tre forskellige kontroller, når en app skal ændre data.

| Spørgsmål | Kontrol |
| ---|--- |
| Hvem må gøre det? | Giv rollen konkrete privilegier. Prøv som rollen. |
| Hvilken værdi sendte brugeren? | Hold SQL-tekst og parameterværdi adskilt. |
| Hvad skal gemmes samlet? | Udfør de afhængige trin i samme transaktion og på samme forbindelse. |

## Prøv opslaget

En ændring kan testes og rulles tilbage. Kontroller derefter prisen i en ny forespørgsel.

```sql
BEGIN;
UPDATE products SET price = price + 1 WHERE name = 'Te';
ROLLBACK;
```

[Øv dig i forløbet](/learn/advanced-03-transactions) · [PostgreSQL om transaktioner](https://www.postgresql.org/docs/16/tutorial-transactions.html)
