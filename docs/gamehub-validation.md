# Validering af GameHub-forløbet

Kontrolleret 8. november 2026.

- Frontend: 22 tests bestået, TypeScript/Vite-build bestået. Lint har ingen fejl;
  eksisterende React-/kodeadvarsler og Vites eksisterende chunkstørrelsesadvarsel består.
- Backend: 22 Raymond-regressioner bestået. Alle nye sider parses af den rigtige
  ContentService og leveres gennem det lokale .NET-API.
- Browser: alle 24 nye indholdssider og fem modulsider åbnet, ingen JavaScript-fejl,
  tre gyldige ZIP-downloads og fire mobilruter uden vandret side-overflow.
- ORM mod rigtig PostgreSQL 16: migrationer, LINQ/demo, gentagen kørsel,
  UNIQUE/FK/CHECK, databevarende schemaændring, scaffolding og regeneration med
  bevaret partial-klasse bestået. Genereret kode indeholder ingen connection string.
- JSONB-opgave: fem checks består efter løsning; starttilstand og mutationer med
  datatab afvises. Benchmarkets 10.000 profiler har samme kontrolsummer og top-20
  i relationel/JSONB-form; 32 planer og genkørsel afprøvet.
- Sikkerhedsopgave: 0/6 checks før løsning, 6/6 efter; for brede rettigheder fanges.
- Testopgave: 2/9 checks før løsning, 9/9 efter; fjernet FK fanges.
- Sikkerheds-/testlab: 14/14 integrationstests mod rigtig PostgreSQL, inklusive
  parametre, apostrof, fjendtligt input, begrænset rolle, SQLSTATE, rollback og
  sidste-plads-samtidighed. Dump/restore til separat database bevarer data og CHECK.
- Alle tre Compose-konfigurationer valideret uden at ændre produktionsstacken.
- ZIP-filer kontrolleret for nødvendige dotfiles og fravær af lokale secrets og
  build-output. Pakningen bruger nu et eksplicit filmanifest.

## Afgrænsninger

Docker-daemonen kunne ikke startes på QA-maskinen. De tilsvarende .NET- og
PostgreSQL-flows blev derfor afprøvet direkte mod en midlertidig lokal PostgreSQL.
Docker-images og containerkørsel er ikke runtime-verificeret. MongoDB-scripts er
syntakskontrolleret, men er ikke kørt mod en rigtig MongoDB-instans i denne QA.
Browserkontrollerne bruger offentligt indhold og gæsteadgang; der er ikke ændret
på Mercantec Auth eller oprettet elevafleveringer i produktion.
