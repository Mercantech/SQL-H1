# Tolv designmønstre til caféskemaet

| Behov | Mønster | Sådan genkender eller afprøver du det |
|---|---|---|
| Stabil identitet | Surrogatnøgle | Kunden beholder sit id ved navneændring. Håndhæv også eventuelle naturlige unikheder. |
| Fælles kategorier | Lookup-tabel | Flere produkter refererer til samme kategorirække via en FK. |
| Mange til mange | Koblingstabel | Et produkt kan indgå i flere køb, og et køb kan have flere produktlinjer. |
| En valgfri profil | 1:1-udvidelse | Profilens kundenøgle er både PK og FK. Kunden kan eksistere, før profilen oprettes. |
| En leder eller overkategori | Selvrefererende FK | En tabel peger på sin egen nøgle. Et træ kræver også håndtering af cyklusser. |
| Arkivér, men bevar historik | Soft delete | Et arkivtidspunkt bevarer rækken. Beslut hvilke lister der viser arkiverede rækker. |
| Oprettelses- og ændringstid | Auditkolonner | Angiv, hvem der sætter tiderne. En enkelt seneste ændringstid er ingen fuld historik. |
| Bevar gårsdagens bon | Historisk stykpris | Salgets aftalte pris bor på bonlinjen. Menuprisen i products kan ændres. |
| Rapportér på tværs af salg | Stjerne eller snefnug | En central faktatabel kan forbindes til dato og produkt. I et snefnug opdeles dimensionerne yderligere. |
| Tillad anonyme salg | Valgfri fremmednøgle | NULL er tilladt for kunden. Et udfyldt kundenummer skal stadig eksistere. |
| Styr et forløb | Statuskolonne | Tilladte værdier og tilladte overgange er to særskilte regler. |
| Giv andre systemer besked om et køb | Transaktionel outbox | Købet og hændelsen gemmes i samme transaktion. Afsenderen skal kunne håndtere gentagelser. |

**Afgør, hvad faktummet beskriver.** Hvis Anna flytter, skal caféens aktuelle kundeby kunne ændres ét sted. Hvis et køb blev leveret til den gamle adresse, er afleveringsstedet en historisk oplysning om det konkrete køb.

**Prøv i morgen.** Skitsér uden opslag, hvordan et produkt kan have én leverandør, mens en leverandør kan have mange produkter. Om en uge kan en makker kontrollere din skitse mod de rigtige nøgler i [leverandøropgaven](/learn/ddl-ex-01).

[PostgreSQL om nøgler og relationer](https://www.postgresql.org/docs/16/ddl-constraints.html) · [Microsoft om normalisering](https://learn.microsoft.com/en-us/office/troubleshoot/access/database-normalization-description)
