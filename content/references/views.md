# Views

Vælg først, hvad én række skal betyde i hvert lag.

| Formål | Greb |
| ---|--- |
| Detalje | Én række pr. ordre. Bevar gæsteordrer med `LEFT JOIN customers`. |
| Rapport | Gruppér detaljerne, fx summer linjebeløb pr. kategori. |
| Adgang | Tildel kun den nødvendige adgang til viewet, og efterprøv basistabellens rettigheder med læserollen. |

## Prøv opslaget

Kontrollér ordre 13 i detaljeviewet. Hvis ordren mangler her, kan en senere SUM ikke genskabe den.

```sql
SELECT order_id, kunde, linje_beloeb
FROM v_order_lines WHERE order_id = 13;
```

[Øv dig i forløbet](/learn/views-03-compose) · [PostgreSQL om CREATE VIEW](https://www.postgresql.org/docs/16/sql-createview.html)
