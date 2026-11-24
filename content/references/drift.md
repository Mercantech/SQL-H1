# Drift af PostgreSQL

Notér database, rolle og tidspunkt, så en anden person kan gentage kontrollen.

| Opgave | Bevis |
| ---|--- |
| Identificer miljø | `current_database()` og `current_user`. |
| Undersøg læsning | Sammenhold `EXPLAIN` før/efter med samme forespørgsel og data. |
| Gendan backup | Brug en separat database og sammenhold en kendt række og en afvist handling. |
| Forbind containere | Brug databasens Compose-servicenavn på det fælles net. |

## Prøv opslaget

GameHubs restore-fixture skal have den kendte række med quantity 2. En ny række med quantity 0 skal afvises af dens CHECK. Gem begge udfald i restore-loggen fra labben.

```sql
SELECT current_database(), current_user;
SELECT * FROM gamehub_demo.restore_probe;
```

[Øv dig i forløbet](/learn/testing-project-01) · [PostgreSQL om dump og gendannelse](https://www.postgresql.org/docs/16/backup-dump.html)
