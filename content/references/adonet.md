# ADO.NET med Npgsql

Vælg metode efter formen på det svar, du skal bruge.

| Behov | Kald |
| ---|--- |
| Flere rækker | `ExecuteReaderAsync`, derpå `ReadAsync`. |
| Én værdi | `ExecuteScalarAsync`, fx `RETURNING id`. |
| Antal ændrede rækker | `ExecuteNonQueryAsync`. |
| SQL NULL i en række | `IsDBNull` før den typede læsning. |
| Flere afhængige skrivninger | Samme forbindelse og transaktion frem til commit. |

## Prøv opslaget

Clara Holm i Viborg skal være én kunde med manglende e-mail. En by uden kunder giver nul objekter. Begge tilfælde skal kunne ses i C#-resultatet.

[Øv dig i forløbet](/learn/adonet-02-command-reader) · [Npgsqls vejledning til dataadgang](https://www.npgsql.org/doc/basic-usage.html)
