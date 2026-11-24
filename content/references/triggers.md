# Hvornår skal en trigger køre?

Spørg først, om en constraint allerede kan beskrive reglen.

| Hændelse | Data i en rækketrigger |
| ---|--- |
| INSERT | `NEW` er den nye række. |
| UPDATE | Sammenlign `OLD` og `NEW`. |
| DELETE | `OLD` er rækken, som slettes. |
| BEFORE UPDATE | Ret `NEW` og returnér rækken for at gemme den. |
| AFTER UPDATE | Registrér fx en bekræftet prisændring i en audittabel. |

## Prøv opslaget

Prøv en ændring og en opdatering til samme pris. En audit for prisændringer bør kun få én ny post. Brug IS DISTINCT FROM til at sammenligne også når NULL er muligt.

```sql
SELECT old_price, new_price
FROM product_audit ORDER BY id DESC LIMIT 2;
```

[Øv dig i forløbet](/learn/triggers-ex-01) · [PostgreSQLs triggerfunktioner](https://www.postgresql.org/docs/16/plpgsql-trigger.html)
