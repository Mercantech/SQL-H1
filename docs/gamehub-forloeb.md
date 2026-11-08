# Raymonds GameHub — målpind 18–24

Et dansk forløb efter de grundlæggende SQL-moduler. Eleverne arbejder med en
spil- og turneringsplatform, undersøger egne resultater og afleverer kode samt
begrundelser. Vælg gerne en anden spilgenre eller egne fiktive profilnavne.

## Kompetencer og evidens

| Målpind | Materiale | Hvad eleven skal vise |
| --- | --- | --- |
| 18: basal ORM | ORM 1–3 og Dapper | Forklare objekter/tabeller, EF Core vs micro-ORM og undersøge genereret SQL |
| 19: model til database | ORM 2–3, projekt 1, ORM-lab | Egne modelændringer, migration, PostgreSQL-skema, LINQ og faktisk resultat |
| 20: database til model | ORM 4, projekt 2, ORM-lab | Scaffold fra eksisterende skema, bevaret partial-udvidelse og kørende C#-forespørgsel |
| 21: dokumentdatabaser | Dokumenter 1–3, SQL-opgave og MongoDB-projekt | CRUD i rigtig MongoDB, begrundet embedding/referencer og forskellen fra JSONB |
| 22: databasevalg | Databasevalg 1–2 og valgprojekt | Arbejdsbelastning, konsistenskrav, reproducerbare målinger, valg af lager og separat adgangslag |
| 23: sikkerhed | Sikkerhed 1–3, SQL-opgave og sikkerhedsprojekt | Trusselsmodel, adgangsbegrænsning, parametriserede angrebsinput og forklaring af kryptering/hashing/nøgler |
| 24: testmetoder | Test 1–3, SQL-opgave og testprojekt | Testplan, positive/negative/grænsecases, integrationstest, rollback/samtidighed og faktisk restore |

## Forslag til undervisning

1. **Byg noget:** Start ORM-labben sammen. Lad makkerpar forudsige SQL, før de
   undersøger den. Hold code-first og database-first i hver sin database.
2. **Udfordr modellen:** Giv en profil et nyt felt og en voksende liste. Lad
   parrene diskutere dokumentgrænser, før de afprøver MongoDB.
3. **Forsvar et valg:** Sammenlign samme logiske data. Kræv et fravalgt alternativ,
   en målebegrænsning og et kriterium for at genoverveje beslutningen.
4. **Luk hullerne:** Afprøv ufarlige injection-strenge i den isolerede lab,
   begræns rettigheder og adskil transportkryptering, lagringskryptering og hashing.
5. **Find en fejl:** Fjern bevidst en regel i den lokale fixture, få en relevant
   test til at fejle, ret fejlen og gentag. Gendan en backup i en separat database.

De korte missionsestimater dækker læsning og små øvelser. Afsæt særskilt tid til
projekter, installation og faglig gennemgang efter holdets erfaring med C#.
Der er ingen forudsætning om, at alle elever afslutter alt på én undervisningsdag.

## Bedømmelse og status

SQL-opgaver kontrollerer den faktiske elevdatabase med `checks.json`. Projekter
køres lokalt i Docker og har konkrete afleveringskrav/rubrikker. Elevens
**Klar til gennemgang** er selvregistreret fremgang, ikke automatisk faglig
godkendelse. Teorisider registreres som åbnet. Ingen af disse registreringer alene
beviser, at hele målpinden er opnået.

Bed eleverne forklare én kodebeslutning uden at læse op, reproducere ét resultat
og vise mindst én negativ test. Lærernoter og facit i labmapperne er undervisningshjælp,
ikke skjulte prøver; eleverne har adgang til filerne.

## Drift og materialer

- Labs: `labs/orm`, `labs/documents`, `labs/security-testing`.
- Elevdownloads pakkes med `python scripts/package-labs.py` og ligger under
  `web/public/downloads/`. Kun filer opført i `scripts/lab-files.json` medtages;
  nødvendige `.config`, `.env.example` og `.gitignore` er med. Lokale ekstra filer
  medtages aldrig automatisk. Symlinks, øvrige `.env*`, `bin`, `obj` og `artifacts` afvises.
- Labs er selvstændige lokale miljøer uden offentlige databaseporte. Nye services
  sættes ikke ind i platformens produktionsstack.
- Sikkerhedslabben indeholder ingen hjemmelavet loginløsning. Brugerlogin i
  Mercantec-apps hører til Mercantec Auth.
- Raymonds nye illustrationer er genbrugt uændret fra LUP-karakterbiblioteket
  i søsterrepoet `Mercantec.tech`; se `web/public/raymond/course/README.md`.

Faglige primærkilder er angivet ved de enkelte lektioner og i labmappernes README.
