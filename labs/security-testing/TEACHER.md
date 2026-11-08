# Lærernoter

Målpind 23 dækkes af security-01/02/03, view-/rettighedsøvelsen og sikkerhedsprojektets demonstrerede kontroller samt briefing om transport, lagring, nøgler og password-hashing. Praktisk injection-forsvar støtter også målpind 14.

Målpind 24 dækkes af testing-01/02/03, constraintopgavens positive/negative/grænsetests og projektets integration, mutation, rollback, samtidighed og restore. Projektet vurderes ved aflevering; det er ikke automatisk bestået på hjemmesiden.

Forslag: to teoriblokke på 30–40 minutter, to sandboxblokke på 20–30 minutter, derefter projektarbejde. Lad makkerpar bytte roller mellem implementering og kontrol. Brug en afsluttende makkerdemonstration med en test, underviseren vælger.

`instructor-solutions.sql` indeholder facit til sandboxens to opgaver. Labprogrammet har sin egen fixture. Del ikke facit før eleverne har formuleret reglerne og forudsagt mindst ét negativt udfald.

Kontroller i samtalen, at eleverne kan forklare forskellen på et sikkert inputparameter og en dynamisk identifikator; på en databaseejer og en begrænset rolle; samt på hash, transportkryptering og krypteret lagring. Et grønt screenshot alene er utilstrækkeligt til den samlede vurdering.

Labben efterlader kun den frivillige `gamehub_demo`-fixture fra restore-øvelsen. Programmet rydder normale testobjekter og sin midlertidige NOLOGIN-rolle op. Dumpet i /tmp indeholder syntetiske data og er ikke krypteret; brug dette til at diskutere nøglehåndtering før arbejde med virkelige data.
