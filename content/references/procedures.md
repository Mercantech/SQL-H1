# Funktioner, procedures og fejl

Vælg kald ud fra kontrakten til den, som skal bruge rutinen.

| Kontrakt | Greb |
| ---|--- |
| Skalar eller tabel i en forespørgsel | `CREATE FUNCTION` og `SELECT`. |
| En særskilt handling | `CREATE PROCEDURE` og `CALL`. |
| Afvis ugyldigt input | Beskriv gyldige værdier, håndtér `NULL`, brug `RAISE EXCEPTION`. |

## Prøv opslaget

Forudsig udfaldet af hvert kald til øvens valideringsfunktion. Kør separate forsøg, så én forventet fejl ikke standser resten.

```sql
SELECT require_positive(1);
-- Afprøv derefter 0, -1 og NULL et ad gangen.
```

[Øv dig i forløbet](/learn/procedures-03-errors) · [PostgreSQL om fejlbeskeder fra PL/pgSQL](https://www.postgresql.org/docs/16/plpgsql-errors-and-messages.html)
