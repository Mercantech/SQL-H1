# Rapporter med Dapper

SQL former resultatsættet. Resultatets kolonnenavne og typer skal passe til DTO'en.

| Kontrakt | Kald |
| ---|--- |
| Nul eller flere rækker | `QueryAsync<Customer>(sql, new { city })`. |
| Præcis én række | `QuerySingleAsync<T>`. |
| Nul eller én | `QuerySingleOrDefaultAsync<T>`. |
| Antal ændrede rækker | `ExecuteAsync`. |
| Et nyt id | `INSERT … RETURNING id` og `QuerySingleAsync<int>`. |

## Prøv opslaget

Brug samme Viborg-filter i ADO.NET og Dapper. Sammenlign rækkefølge, kunde-id og nullable e-mail. Gentag med Aarhus for at teste byparameteren.

[Øv dig i forløbet](/learn/dapper-01-intro) · [Dappers egen vejledning](https://github.com/DapperLib/Dapper#readme)
