# Dokumenter og JSONB

Brug adgangsmønster og forventet vækst, når du vælger hvordan data skal ligge.

| Behov | Greb |
| ---|--- |
| En lille del læses og ændres med ejeren | Overvej indlejring. |
| Mange elementer vokser og hentes sidevis | Overvej særskilt collection og reference. |
| Ret ét felt i MongoDB | `$set` med feltsti, fx `settings.theme`. |
| Ret ét felt i JSONB | `jsonb_set` med sti, fx `{settings,theme}`. |
| Mål læsearbejde | Sammenlign samme resultat og plan før/efter indeks. |

## Prøv opslaget

Kontrollér at Novas nye tema er rigtigt, at søskendefelterne er bevaret, og at en anden spillers dokument forblev uændret.

[Øv dig i forløbet](/learn/documents-project-01) · [MongoDBs vejledning til datamodellering](https://www.mongodb.com/docs/manual/data-modeling/)
