---
title: Projekt — GameHubs sikkerhedsvagt
slug: security-project-01
module: security
order: 11
kind: project
objectives:
  - Afprøve parametriserede C#-forespørgsler med fjendtligt input
  - Dokumentere adgangsbegrænsning med en anden databaserolle
  - Begrunde kryptering, nøglehåndtering og central login
---

# GameHubs sikkerhedsvagt

![Raymond holder vagt ved GameHubs data](/raymond/course/security.webp)

**Mission · Målpind 23 og praktisk støtte til 14 · 60–90 minutter · Makkerpar.** I er det hold, der giver GameHub grønt lys til finalen. Løsningen skal kunne vises, ikke bare beskrives.

Dette projekt udføres lokalt i Docker. Det bliver ikke automatisk bestået af SQL-editoren. Hent [labpakken](/downloads/security-testing-lab.zip), pak den ud, og følg `README.md`. Du behøver Docker; .NET kører i containeren.

## Første checkpoint: et søgefelt der holder

Kør labbens automatiske tests. Find søgemetoden i `Program.cs`. Den skal bevare værdiparametret for input. Vis resultater for `Nova`, `O'Neil` og `Nova' OR '1'='1`. De to første er rigtige navne; det sidste er en bogstavelig søgetekst og må ikke returnere alle spillere.

Tilføj en ny test for en apostrof, der ikke er et eksisterende navn. Bonus: tilføj allowlist-sortering med præcis to godkendte kolonner og en test, der afviser et ukendt sorteringsvalg.

## Andet checkpoint: en rolle der får et nej

Labben tester en begrænset læserolle med `SET LOCAL ROLE`: viewet må læses; basistabellens private e-mails må ikke. Forklar, hvorfor dette bevis er stærkere end at udføre SELECT som databaseejer. Adminforbindelsen findes kun i den lokale testfixture; GameHubs produktionsapp skal bruge en særskilt begrænset konto.

## Tredje checkpoint: sikkerhedsbriefing

Lav en side med jeres trusselsmodel, tre konkrete kontroller og deres begrænsninger. Medtag transportkryptering og certifikatvalidering, kryptering af lager/backup, placering og rotation af nøgler samt forskellen på hashing og kryptering. Ingen egen passwordtabel: brugerlogin hører til Mercantec Auth. Labben implementerer ikke login.

## Aflevering og godkendelseskriterier

Aflever kodeændring, testoutput med dato og én side sikkerhedsbriefing. Medtag ingen passwords, `.env` eller database-dumps i Git.

| Kriterium | Det skal kunne ses |
|---|---|
| Søgning | Gyldigt navn, legitim apostrof og fjendtlig tekst er testet |
| Rettigheder | View tillades, privat tabel afvises som begrænset rolle |
| Kryptering | Transport, lagring og nøgler skelnes med en konkret begrænsning |
| Identitet | Hashing forklares; Mercantec Auth og appens autorisation har tydelige roller |
| Selvstændigt arbejde | Mindst én ny relevant test og forklaring af dens forventning |

Byt briefing med et andet par. De vælger én kontrol og beder jer demonstrere den. Underviseren vurderer den samlede aflevering; grønt testoutput alene er ikke hele målpinden.
