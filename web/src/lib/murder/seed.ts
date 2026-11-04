export type MurderColumn = { name: string; type: string; key?: "PK" | "FK"; references?: string };
export type MurderTable = { name: string; label: string; description: string; columns: MurderColumn[] };

export const MURDER_TABLES: MurderTable[] = [
  { name: "sagsrapporter", label: "Sagsrapporter", description: "Politiets rapporter. Find den rigtige dato, hændelse og by.", columns: [
    { name: "id", type: "INTEGER", key: "PK" }, { name: "dato", type: "TEXT" }, { name: "type", type: "TEXT" }, { name: "by", type: "TEXT" }, { name: "beskrivelse", type: "TEXT" },
  ] },
  { name: "personer", label: "Personer", description: "Konferencens deltagere og deres opholdssteder i den fiktive historie.", columns: [
    { name: "id", type: "INTEGER", key: "PK" }, { name: "navn", type: "TEXT" }, { name: "rolle", type: "TEXT" }, { name: "organisation", type: "TEXT" }, { name: "sted", type: "TEXT" },
  ] },
  { name: "afhoeringer", label: "Afhøringer", description: "Vidneudsagn og forklaringer. Kobl person_id til personer.id.", columns: [
    { name: "person_id", type: "INTEGER", key: "PK", references: "personer.id" }, { name: "udskrift", type: "TEXT" },
  ] },
  { name: "adgangskort", label: "Adgangskort", description: "Et kort tilhører én person. Flere kort kan have samme type.", columns: [
    { name: "id", type: "TEXT", key: "PK" }, { name: "person_id", type: "INTEGER", key: "FK", references: "personer.id" }, { name: "korttype", type: "TEXT" },
  ] },
  { name: "adgangslog", label: "Adgangslog", description: "Registreringer fra dørlæserne. Tider er tekst i formatet HH:MM.", columns: [
    { name: "id", type: "INTEGER", key: "PK" }, { name: "kort_id", type: "TEXT", key: "FK", references: "adgangskort.id" }, { name: "lokale", type: "TEXT" }, { name: "dato", type: "TEXT" }, { name: "tidspunkt", type: "TEXT" },
  ] },
  { name: "sessioner", label: "Sessioner", description: "Programmet med oplæg, workshops og faglige spor.", columns: [
    { name: "id", type: "INTEGER", key: "PK" }, { name: "titel", type: "TEXT" }, { name: "spor", type: "TEXT" }, { name: "lokale", type: "TEXT" },
  ] },
  { name: "tilmeldinger", label: "Tilmeldinger", description: "Forbindelsen mellem personer og sessioner. En person kan deltage flere gange.", columns: [
    { name: "person_id", type: "INTEGER", key: "PK", references: "personer.id" }, { name: "session_id", type: "INTEGER", key: "PK", references: "sessioner.id" },
  ] },
  { name: "transaktioner", label: "Transaktioner", description: "Fiktive betalinger med afsender, modtager og betalingsreference.", columns: [
    { name: "id", type: "INTEGER", key: "PK" }, { name: "afsender_id", type: "INTEGER", key: "FK", references: "personer.id" }, { name: "modtager_id", type: "INTEGER", key: "FK", references: "personer.id" }, { name: "beloeb", type: "INTEGER" }, { name: "dato", type: "TEXT" }, { name: "reference", type: "TEXT" },
  ] },
  { name: "beskeder", label: "Beskeder", description: "Fiktive beskeder, som kan bekræfte forbindelserne i sagen.", columns: [
    { name: "id", type: "INTEGER", key: "PK" }, { name: "afsender_id", type: "INTEGER", key: "FK", references: "personer.id" }, { name: "modtager_id", type: "INTEGER", key: "FK", references: "personer.id" }, { name: "dato", type: "TEXT" }, { name: "indhold", type: "TEXT" },
  ] },
];

export const STARTER_SQL = `-- Find rapporten om mordet i Viborg den 14. oktober 2026.
SELECT *
FROM sagsrapporter
WHERE dato = '2026-10-14';`;

export const HINTS = [
  {
    title: "Find den rigtige sagsrapport",
    steps: [
      "Begynd i sagsrapporter. Datoer er tekst i formatet ÅÅÅÅ-MM-DD.",
      "Der findes flere hændelser samme dag. Kombinér dato, type og by med AND.",
      "Filtrér på dato = '2026-10-14', type = 'mord' og by = 'Viborg'. Læs hele beskrivelsen.",
    ],
    sql: "SELECT * FROM sagsrapporter\nWHERE dato = '2026-10-14'\n  AND type = 'mord' AND by = 'Viborg';",
  },
  {
    title: "Find og afhør vidnerne",
    steps: [
      "Rapporten beskriver to vidner. Find dem i personer med navn og sted.",
      "LIKE 'Anders%' og LIKE 'Mads%' kan finde navnene. Afhøringer bruger person_id.",
      "JOIN personer p med afhoeringer a ON a.person_id = p.id. Læs begge udsagn.",
    ],
    sql: "SELECT p.navn, a.udskrift\nFROM personer p\nJOIN afhoeringer a ON a.person_id = p.id\nWHERE (p.navn LIKE 'Anders%' AND p.sted = 'C#-loungen')\n   OR (p.navn LIKE 'Mads%' AND p.sted = 'Sal 2');",
  },
  {
    title: "Følg kortet til Arkivet",
    steps: [
      "Det ene vidne beskriver et teknikkort, der begynder med DR-7. Flere personer passer på det spor.",
      "Kobl adgangskort.id til adgangslog.kort_id. Se efter Arkivet på morddagen mellem 20:10 og 20:20.",
      "Brug LIKE 'DR-7%', korttype = 'teknik' og tidspunkt BETWEEN '20:10' AND '20:20'. Der er stadig mere end én kandidat.",
    ],
    sql: "SELECT DISTINCT p.id, p.navn\nFROM personer p\nJOIN adgangskort k ON k.person_id = p.id\nJOIN adgangslog l ON l.kort_id = k.id\nWHERE k.id LIKE 'DR-7%' AND k.korttype = 'teknik'\n  AND l.dato = '2026-10-14' AND l.lokale = 'Arkivet'\n  AND l.tidspunkt BETWEEN '20:10' AND '20:20';",
  },
  {
    title: "Sammenhold sporene",
    steps: [
      "Det andet vidne genkendte personen fra to bestemte workshops. Begge spor skal passe.",
      "Kobl tilmeldinger til sessioner. Find deltagere i både 'SQL under pres' og 'C# uden spor'.",
      "Filtrér de to titler og brug GROUP BY person_id HAVING COUNT(DISTINCT session_id) = 2. Sammenhold med kortsporet.",
    ],
    sql: "SELECT p.id, p.navn\nFROM personer p\nJOIN tilmeldinger t ON t.person_id = p.id\nJOIN sessioner s ON s.id = t.session_id\nWHERE s.titel IN ('SQL under pres', 'C# uden spor')\n  AND p.id IN (\n    SELECT k.person_id FROM adgangskort k\n    JOIN adgangslog l ON l.kort_id = k.id\n    WHERE k.id LIKE 'DR-7%' AND k.korttype = 'teknik'\n      AND l.dato = '2026-10-14' AND l.lokale = 'Arkivet'\n      AND l.tidspunkt BETWEEN '20:10' AND '20:20'\n  )\nGROUP BY p.id, p.navn\nHAVING COUNT(DISTINCT s.id) = 2;",
  },
  {
    title: "Find personen bag mordet",
    steps: [
      "Find den mistænktes egen afhøring i afhoeringer. Den peger på en betaling og en besked.",
      "Søg efter en betaling på 75.000 den 13. oktober med reference 'ARKIV-26'. Find også beskeder til modtageren.",
      "Kobl transaktioner.afsender_id til personer.id. En besked fra samme afsender skal bekræfte motivet og planen.",
    ],
    sql: "SELECT p.navn, t.beloeb, t.reference, b.indhold\nFROM transaktioner t\nJOIN personer p ON p.id = t.afsender_id\nJOIN beskeder b ON b.afsender_id = t.afsender_id\n  AND b.modtager_id = t.modtager_id\nWHERE t.modtager_id = (SELECT id FROM personer WHERE navn = 'Rune Falk')\n  AND t.beloeb = 75000 AND t.dato = '2026-10-13'\n  AND t.reference = 'ARKIV-26';",
  },
];

export function checkAccusation(name: string, phase: "killer" | "mastermind") {
  const normalized = name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("da-DK");
  const correct = normalized === (phase === "killer" ? "rune falk" : "clara holm");
  if (!correct) return { correct: false, message: "Det navn passer ikke med alle sporene. Sammenhold vidneudsagnene med de registrerede data, og prøv igen." };
  return {
    correct: true,
    message: phase === "killer"
      ? "Rune Falk er den fiktive morder. Kortet, adgangsloggen og de to workshoptilmeldinger peger på ham. Men hvem bestilte mordet? Læs hans afhøring og følg pengene."
      : "Clara Holm er den fiktive bagmand. Betalingen på 75.000 kr. med reference ARKIV-26 og hendes besked til Rune bekræfter planen: at forhindre Viktor i at afsløre svindlen. Sagen er opklaret.",
  };
}

// Original, fictional teaching dataset. Real IT profiles appear only as guests or witnesses.
export const MURDER_SEED_SQL = `
PRAGMA foreign_keys = ON;
CREATE TABLE sagsrapporter (id INTEGER PRIMARY KEY, dato TEXT NOT NULL, type TEXT NOT NULL, by TEXT NOT NULL, beskrivelse TEXT NOT NULL);
CREATE TABLE personer (id INTEGER PRIMARY KEY, navn TEXT NOT NULL, rolle TEXT NOT NULL, organisation TEXT NOT NULL, sted TEXT NOT NULL);
CREATE TABLE afhoeringer (person_id INTEGER PRIMARY KEY REFERENCES personer(id), udskrift TEXT NOT NULL);
CREATE TABLE adgangskort (id TEXT PRIMARY KEY, person_id INTEGER NOT NULL REFERENCES personer(id), korttype TEXT NOT NULL);
CREATE TABLE adgangslog (id INTEGER PRIMARY KEY, kort_id TEXT NOT NULL REFERENCES adgangskort(id), lokale TEXT NOT NULL, dato TEXT NOT NULL, tidspunkt TEXT NOT NULL);
CREATE TABLE sessioner (id INTEGER PRIMARY KEY, titel TEXT NOT NULL, spor TEXT NOT NULL, lokale TEXT NOT NULL);
CREATE TABLE tilmeldinger (person_id INTEGER NOT NULL REFERENCES personer(id), session_id INTEGER NOT NULL REFERENCES sessioner(id), PRIMARY KEY (person_id, session_id));
CREATE TABLE transaktioner (id INTEGER PRIMARY KEY, afsender_id INTEGER NOT NULL REFERENCES personer(id), modtager_id INTEGER NOT NULL REFERENCES personer(id), beloeb INTEGER NOT NULL, dato TEXT NOT NULL, reference TEXT NOT NULL);
CREATE TABLE beskeder (id INTEGER PRIMARY KEY, afsender_id INTEGER NOT NULL REFERENCES personer(id), modtager_id INTEGER NOT NULL REFERENCES personer(id), dato TEXT NOT NULL, indhold TEXT NOT NULL);

INSERT INTO sagsrapporter VALUES
(1, '2026-10-12', 'tyveri', 'Viborg', 'En bærbar computer forsvandt fra receptionen. Fundet i garderoben dagen efter.'),
(2, '2026-10-14', 'tyveri', 'Viborg', 'En konferencetaske blev meldt stjålet i foyeren klokken 14:30.'),
(3, '2026-10-14', 'mord', 'Aarhus', 'En anden sag i en anden by. Ikke tilknyttet Datatopmødet.'),
(4, '2026-10-14', 'mord', 'Viborg', 'SAG 26-1014: Databasearkitekt Viktor Vang blev fundet død i Arkivet ved Datatopmødet. Gerningsperioden er kl. 20:10–20:20. To vidner blev set tæt på: en oplægsholder ved navn Anders i C#-loungen og en oplægsholder ved navn Mads i Sal 2. Find deres forklaringer. Alle begivenheder i denne sag er opdigtede.'),
(5, '2026-10-14', 'alarm', 'Viborg', 'Brandalarmen blev udløst af en fejl i køkkenet klokken 17:05.'),
(6, '2026-10-15', 'mord', 'Viborg', 'En fejlregistrering fra en øvelse. Vedrører ikke hændelsen den 14. oktober.'),
(7, '2026-10-13', 'hærværk', 'København', 'En reklameskærm blev beskadiget under opsætning.');

INSERT INTO personer VALUES
(1, 'Anders Hejlsberg', 'Oplægsholder', 'Sprogdesign', 'C#-loungen'),
(2, 'Bjarne Stroustrup', 'Oplægsholder', 'C++', 'Sal 1'),
(3, 'Rasmus Lerdorf', 'Oplægsholder', 'PHP', 'Web-loungen'),
(4, 'Mads Torgersen', 'Oplægsholder', 'C#-sprogdesign', 'Sal 2'),
(5, 'Thomas Kejser', 'Oplægsholder', 'SQL og databaseperformance', 'SQL-loungen'),
(6, 'David Heinemeier Hansson', 'Oplægsholder', 'Ruby on Rails', 'Web-loungen'),
(7, 'Viktor Vang', 'Databasearkitekt · fiktiv', 'Norddata · fiktiv', 'Arkivet'),
(8, 'Rune Falk', 'Tekniker · fiktiv', 'Driftspartner · fiktiv', 'Teknikrummet'),
(9, 'Clara Holm', 'Projektchef · fiktiv', 'Norddata · fiktiv', 'Mødelokale B'),
(10, 'Nikolaj Berg', 'Tekniker · fiktiv', 'Driftspartner · fiktiv', 'Teknikrummet'),
(11, 'Lea Møller', 'Tekniker · fiktiv', 'Lyd og lys · fiktiv', 'Sal 1'),
(12, 'Sofie Lund', 'Udvikler · fiktiv', 'Kodeværket · fiktiv', 'SQL-loungen'),
(13, 'Emil Bak', 'Udvikler · fiktiv', 'Kodeværket · fiktiv', 'Sal 2'),
(14, 'Freja Dahl', 'Arrangør · fiktiv', 'Datatopmødet · fiktiv', 'Receptionen'),
(15, 'Oscar Lind', 'Vagt · fiktiv', 'Tryg Vagt · fiktiv', 'Hovedindgangen'),
(16, 'Ida Nørgaard', 'Analytiker · fiktiv', 'Norddata · fiktiv', 'Mødelokale A'),
(17, 'Anders Nyholm', 'Kursist · fiktiv', 'Campus · fiktiv', 'Sal 1'),
(18, 'Mads Jensen', 'Kursist · fiktiv', 'Campus · fiktiv', 'Web-loungen'),
(19, 'Liv Sørensen', 'Konsulent · fiktiv', 'Datablik · fiktiv', 'SQL-loungen'),
(20, 'Tobias Winther', 'Administrator · fiktiv', 'Driftspartner · fiktiv', 'Serverrummet'),
(21, 'Alma Friis', 'Udvikler · fiktiv', 'Norddata · fiktiv', 'Sal 3'),
(22, 'Erik Ejlskov Jensen', 'Oplægsholder', 'Entity Framework-værktøjer', 'Sal 3');

INSERT INTO afhoeringer VALUES
(1, 'Jeg var i C#-loungen. Omkring 20:15 så jeg en person gå mod Arkivet med et sort teknikkort. Kortnummeret begyndte med DR-7. Jeg kunne ikke se resten. Dørlæseren må have registreret kortet.'),
(2, 'Jeg diskuterede ressourcehåndtering i Sal 1 mellem 20:00 og 20:30. Jeg så ikke, hvem der gik ind i Arkivet.'),
(3, 'Jeg var i Web-loungen. Jeg hørte alarmen tidligere på dagen, men jeg så ikke hændelsen i Arkivet.'),
(4, 'Jeg genkendte personen på gangen fra workshops tidligere på dagen. Vedkommende var tilmeldt både SQL under pres og C# uden spor. Jeg er sikker på, at det var begge workshops, ikke blot én af dem.'),
(5, 'Jeg holdt et oplæg om databaseperformance. Sessionernes tilmeldinger er registreret i programdatabasen, men et enkelt oplæg er ikke bevis nok.'),
(6, 'Jeg talte om webudvikling i Web-loungen. Receptionisten kan bekræfte, at jeg var der hele aftenen.'),
(8, 'Jeg indrømmer mordet. Jeg handlede på ordre fra en anden. Den 13. oktober fik jeg præcis 75.000 kr. med reference ARKIV-26. En besked fra samme person forklarede, hvorfor Viktor skulle bringes til tavshed. Find både betalingen og beskeden; navnelighed er ikke bevis.'),
(9, 'Jeg havde møder hele dagen. Mine betalinger var angiveligt konsulenthonorarer. Det er min forklaring.'),
(10, 'Jeg hentede et kabel i Arkivet klokken 20:12. Jeg deltog i SQL under pres, men ikke C# uden spor.'),
(11, 'Mit kort starter også med DR-7. Jeg var i Arkivet klokken 19:40 og gik derefter til Sal 1.'),
(12, 'Jeg deltog i begge workshops, men mit gæstekort har ikke adgang til Arkivet.'),
(13, 'Jeg gik tidligt hjem. Jeg var kun tilmeldt workshoppen C# uden spor.'),
(14, 'En tilmelding viser, at man har meldt sig til et oplæg. Kombinér derfor programmet med dørlæserens registreringer og vidnerne.'),
(15, 'Arkivets dørlæser fungerede hele aftenen. Kortene blev ikke udlånt, og tidsstemplerne blev kontrolleret efter hændelsen.'),
(16, 'Viktor havde fundet fiktive konsulentfakturaer i Norddatas projektregnskab. Han ville fremlægge dem næste morgen.'),
(17, 'Jeg hedder også Anders, men jeg sad i Sal 1. Jeg var ikke i C#-loungen.'),
(18, 'Jeg hedder Mads Jensen og var i Web-loungen. Vidnet i Sal 2 var en anden Mads.'),
(19, 'Jeg overførte et almindeligt honorar til Rune for opsætning af projektorer. Beløbet var 7.500 kr., ikke 75.000 kr.'),
(20, 'Jeg testede Arkivets dørlæser dagen før konferencen. Husk at filtrere på den rigtige dato.'),
(21, 'Viktor havde en mappe mærket Revision. Han var nervøs for præsentationen næste morgen.'),
(22, 'Jeg holdt workshop i Sal 3. Tilmeldinger og adgangskort bruger personens id; et navn bør ikke bruges som fremmednøgle.');

INSERT INTO adgangskort VALUES
('GA-101', 1, 'gæst'), ('GA-102', 2, 'gæst'), ('GA-103', 3, 'gæst'), ('GA-104', 4, 'gæst'),
('GA-105', 5, 'gæst'), ('GA-106', 6, 'gæst'), ('ST-201', 7, 'ansat'),
('DR-701', 8, 'teknik'), ('ST-202', 9, 'ansat'), ('DR-702', 10, 'teknik'), ('DR-703', 11, 'teknik'),
('GA-112', 12, 'gæst'), ('GA-113', 13, 'gæst'), ('AR-301', 14, 'arrangør'), ('VA-401', 15, 'vagt'),
('ST-203', 16, 'ansat'), ('GA-117', 17, 'gæst'), ('GA-118', 18, 'gæst'), ('GA-119', 19, 'gæst'),
('DR-704', 20, 'teknik'), ('ST-204', 21, 'ansat'), ('GA-122', 22, 'gæst');

INSERT INTO adgangslog VALUES
(1, 'GA-101', 'C#-loungen', '2026-10-14', '19:50'),
(2, 'GA-104', 'Sal 2', '2026-10-14', '19:55'),
(3, 'ST-201', 'Arkivet', '2026-10-14', '20:00'),
(4, 'DR-701', 'Arkivet', '2026-10-14', '20:16'),
(5, 'DR-702', 'Arkivet', '2026-10-14', '20:12'),
(6, 'DR-703', 'Arkivet', '2026-10-14', '19:40'),
(7, 'DR-704', 'Arkivet', '2026-10-13', '20:15'),
(8, 'DR-701', 'Teknikrummet', '2026-10-14', '19:30'),
(9, 'DR-702', 'Teknikrummet', '2026-10-14', '20:25'),
(10, 'DR-703', 'Sal 1', '2026-10-14', '20:05'),
(11, 'ST-202', 'Mødelokale B', '2026-10-14', '20:02'),
(12, 'GA-112', 'SQL-loungen', '2026-10-14', '20:14'),
(13, 'VA-401', 'Hovedindgangen', '2026-10-14', '20:15'),
(14, 'GA-102', 'Sal 1', '2026-10-14', '19:55'),
(15, 'GA-103', 'Web-loungen', '2026-10-14', '19:50'),
(16, 'GA-105', 'SQL-loungen', '2026-10-14', '19:45'),
(17, 'GA-106', 'Web-loungen', '2026-10-14', '19:48'),
(18, 'AR-301', 'Receptionen', '2026-10-14', '20:11'),
(19, 'ST-203', 'Mødelokale A', '2026-10-14', '20:10'),
(20, 'GA-117', 'Sal 1', '2026-10-14', '20:08'),
(21, 'GA-118', 'Web-loungen', '2026-10-14', '20:07'),
(22, 'GA-119', 'SQL-loungen', '2026-10-14', '20:04'),
(23, 'DR-704', 'Serverrummet', '2026-10-14', '20:15'),
(24, 'ST-204', 'Sal 3', '2026-10-14', '20:10'),
(25, 'GA-122', 'Sal 3', '2026-10-14', '20:03'),
(26, 'DR-701', 'Arkivet', '2026-10-13', '15:05'),
(27, 'DR-702', 'Arkivet', '2026-10-14', '17:00'),
(28, 'ST-201', 'Mødelokale A', '2026-10-14', '16:30'),
(29, 'DR-703', 'Teknikrummet', '2026-10-14', '20:40'),
(30, 'DR-704', 'Arkivet', '2026-10-15', '20:15');

INSERT INTO sessioner VALUES
(1, 'SQL under pres', 'SQL', 'SQL-loungen'),
(2, 'C# uden spor', 'C#', 'Sal 2'),
(3, 'C++ og ressourcer', 'C++', 'Sal 1'),
(4, 'PHP i praksis', 'Web', 'Web-loungen'),
(5, 'TypeScript og typer', 'TypeScript', 'C#-loungen'),
(6, 'EF Core i værktøjskassen', '.NET', 'Sal 3'),
(7, 'Rails fra idé til produkt', 'Web', 'Web-loungen'),
(8, 'Revision med SQL', 'SQL', 'Mødelokale A');

INSERT INTO tilmeldinger VALUES
(1, 5), (1, 2), (2, 3), (3, 4), (4, 2), (5, 1), (5, 8), (6, 7),
(7, 8), (7, 1), (8, 1), (8, 2), (8, 6), (9, 8), (9, 7),
(10, 1), (10, 3), (11, 2), (11, 4), (12, 1), (12, 2),
(13, 2), (13, 5), (14, 7), (15, 3), (16, 8), (16, 1),
(17, 3), (18, 4), (19, 1), (19, 8), (20, 1), (20, 2), (21, 6), (22, 6);

INSERT INTO transaktioner VALUES
(1, 9, 8, 75000, '2026-10-13', 'ARKIV-26'),
(2, 19, 8, 7500, '2026-10-13', 'PROJEKTOR'),
(3, 14, 10, 4200, '2026-10-13', 'KABEL-26'),
(4, 9, 16, 75000, '2026-10-13', 'ANALYSE-26'),
(5, 16, 8, 75000, '2026-09-13', 'ARKIV-25'),
(6, 14, 11, 9600, '2026-10-14', 'LYD-LYS'),
(7, 21, 12, 1800, '2026-10-12', 'WORKSHOP'),
(8, 9, 20, 12500, '2026-10-11', 'DRIFT-26'),
(9, 19, 10, 75000, '2026-10-13', 'SERVERKØB'),
(10, 14, 8, 3200, '2026-10-15', 'OPRYDNING');

INSERT INTO beskeder VALUES
(1, 9, 8, '2026-10-13', 'ARKIV-26 er overført: 75.000. Viktor har fundet mine falske konsulentfakturaer. Han må ikke fremlægge beviserne i morgen. Brug dit teknikkort til Arkivet mellem 20:10 og 20:20; bring ham til tavshed for altid.'),
(2, 19, 8, '2026-10-13', 'Tak for opsætning af projektorerne. Honoraret på 7.500 er overført.'),
(3, 14, 10, '2026-10-13', 'Kan du hente det ekstra HDMI-kabel i Arkivet i morgen aften?'),
(4, 7, 16, '2026-10-14', 'Jeg har fundet uregelmæssighederne i regnskabet. Gem en kopi; jeg fremlægger dokumentationen i morgen.'),
(5, 9, 16, '2026-10-13', 'Budgettet til analyseprojektet er godkendt. Beløbet dækker de aftalte konsulenttimer.'),
(6, 14, 11, '2026-10-14', 'Tak for hjælpen med lyden. Sal 1 skal være klar klokken 20.'),
(7, 21, 12, '2026-10-12', 'Workshopmaterialet er klar til tryk.'),
(8, 9, 20, '2026-10-11', 'Tak for servervedligeholdelsen. Faktura DRIFT-26 er betalt.'),
(9, 19, 10, '2026-10-13', 'Her er betalingen for den nye server. Husk serienummeret på fakturaen.'),
(10, 8, 9, '2026-10-14', 'Jeg har modtaget ARKIV-26 og forstået instruktionen. Jeg bruger DR-701.'),
(11, 14, 8, '2026-10-15', 'Det aftalte beløb til oprydning er overført af økonomiafdelingen.');
`;
