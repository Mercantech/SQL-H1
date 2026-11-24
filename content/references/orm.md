# EF Core og skemaets ejer

Før du ændrer modellen, afgør hvem der styrer databaseskemaet.

| Udgangspunkt | Arbejdsgang | Bevis |
| ---|---|--- |
| C#-model er kilden | Model → migration → SQL → database | Eksisterende rækker overlever migrationen. |
| Eksisterende skema er kilden | Database → scaffold → genererede typer | En ny kolonne ses efter regeneration; egen partial-klasse er bevaret. |
| LINQ til en skærm | Filtrér og projicér før materialisering | Kontrollér genereret SQL og forventede rækker. |

## Prøv opslaget

DBA'en tilføjer `platform` til legacy-tabellen. Skriv først, hvilken C#-egenskab du forventer. Generér modellen igen, og kontrollér, at `Tournament.Platform` og din egen `DisplayName` begge kan bruges. I code-first-labben starter `PrizePool` derimod i C#-modellen. Kontrollér, at migrationen bevarer de eksisterende turneringer med 0 i præmiepuljen.

[Øv dig i forløbet](/learn/orm-04-database-first) · [Microsoft om scaffolding](https://learn.microsoft.com/en-us/ef/core/managing-schemas/scaffolding/)
