import type { RaymondMood } from "./raymond";

export const raymondReactionCategories = [
  { id: "learning", label: "Læring og idéer" },
  { id: "feedback", label: "Feedback og følelser" },
  { id: "sql", label: "SQL og databaser" },
  { id: "breaks", label: "Hilsner og pauser" },
] as const;

export type RaymondReactionCategory = (typeof raymondReactionCategories)[number]["id"];

function reaction<Id extends string>(id: Id, label: string, description: string, category: RaymondReactionCategory) {
  return { id, label, description, category, src: `/raymond/reactions/${id}.webp` };
}

/** Existing LUP illustrations, copied without editing. Each reaction has a visible Danish name. */
export const raymondReactions = [
  reaction("applause", "Godt arbejde!", "Raymond klapper, når en opgave er bestået, og indsatsen må fejres.", "feedback"),
  reaction("backup", "Husk din backup", "Gem en kopi, og kontrollér, at dine data kan genskabes.", "sql"),
  reaction("celebration", "Det skal fejres", "Et afsluttet trin er en anledning til at se, hvor langt du er kommet.", "feedback"),
  reaction("coffee", "Kaffepause", "Tag en kort pause, og vend tilbage til problemet med friske øjne.", "breaks"),
  reaction("commit", "Gem dit arbejde", "Saml en meningsfuld ændring, og gem den med en forklarende commit.", "sql"),
  reaction("confused", "Hvad skete der?", "Når resultatet overrasker, hjælper det at undersøge én ting ad gangen.", "feedback"),
  reaction("curious", "Lad os undersøge det", "Stil et spørgsmål, afprøv en idé, og læs resultatet grundigt.", "learning"),
  reaction("debugging", "Vi finder fejlen", "Læs fejlbeskeden, find årsagen, og prøv det mindste næste skridt.", "feedback"),
  reaction("determined", "Ét forsøg mere", "Del opgaven op i små trin, og byg videre på det, du allerede ved.", "learning"),
  reaction("error", "Noget skal undersøges", "En fejl er information om, hvad databasen ikke kunne gennemføre.", "feedback"),
  reaction("eureka", "Aha!", "Pludselig hænger forklaringen og det faktiske resultat sammen.", "learning"),
  reaction("facepalm", "Hov, en forglemmelse", "Små forglemmelser sker for alle; et ekstra kig kan gøre forskellen.", "feedback"),
  reaction("filter", "Vælg de rigtige rækker", "Brug et tydeligt filter, så din forespørgsel svarer på det rigtige spørgsmål.", "sql"),
  reaction("focused", "Fordybelse", "Hold fokus på ét krav og undersøg resultatet, før du lægger mere til.", "learning"),
  reaction("foreign-key", "Følg relationen", "En fremmednøgle forbinder rækken med en eksisterende række i en anden tabel.", "sql"),
  reaction("good-morning", "Godmorgen", "En ny dag er en god anledning til at prøve en ny SQL-idé.", "breaks"),
  reaction("goodbye", "Vi ses igen", "Gem dit arbejde, så du kan fortsætte derfra næste gang.", "breaks"),
  reaction("grateful", "Tak for hjælpen", "En god forklaring fra en makker kan gøre en svær opgave overskuelig.", "feedback"),
  reaction("help", "Et lille skub", "Bed om et hint, som hjælper dig videre uden at overtage løsningen.", "learning"),
  reaction("idea-notes", "Skriv idéen ned", "Sæt ord på din plan, og brug den til at holde styr på næste skridt.", "learning"),
  reaction("join", "Forbind tabellerne", "Find nøglerne, og forklar hvilke rækker din JOIN skal bevare.", "sql"),
  reaction("laughing", "Et smil undervejs", "Der må gerne være plads til et grin, mens vi lærer noget nyt.", "feedback"),
  reaction("listening", "Jeg lytter", "Forklar problemet med dine egne ord; ofte dukker næste skridt op imens.", "learning"),
  reaction("normalize", "Giv data et hjem", "Normalisering hjælper dig med at undgå gentagelser og modstridende oplysninger.", "sql"),
  reaction("patient", "Tag den tid, du har brug for", "Forståelsen kommer i små skridt, og du må gerne prøve igen.", "feedback"),
  reaction("performance", "Mål før du gætter", "Undersøg planen og målingerne, før du beslutter, hvad der skal optimeres.", "sql"),
  reaction("primary-key", "Find identiteten", "En primærnøgle gør det muligt at identificere hver række entydigt.", "sql"),
  reaction("proud", "Se din fremgang", "Du kan bruge din løsning og forklaring til at vise, hvad du har lært.", "feedback"),
  reaction("query-ready", "Klar til SQL", "Raymond er klar, når du vil stille databasen dit næste spørgsmål.", "sql"),
  reaction("question", "Hvad tror du?", "Lav en forudsigelse, inden du kører koden, og sammenlign bagefter.", "learning"),
  reaction("reading", "Læs og afprøv", "Kobl forklaringen i teorien til et lille eksperiment i din egen database.", "learning"),
  reaction("relieved", "Nu giver det mening", "En tydelig forklaring kan gøre en indviklet fejl til et overkommeligt trin.", "feedback"),
  reaction("restore", "Genskab og kontrollér", "En backup er først afprøvet, når du har gendannet og kontrolleret data.", "sql"),
  reaction("rollback", "Rul tilbage", "En transaktion kan fortryde ændringer, så en operation ikke efterlades halvt færdig.", "sql"),
  reaction("safe-lock", "Pas på dine data", "Parametre, begrænset adgang og beskyttede secrets har hver deres opgave.", "sql"),
  reaction("skeptical", "Lad os dobbelttjekke", "Et plausibelt resultat er en god anledning til at efterprøve antagelserne.", "learning"),
  reaction("sleepy", "Tid til at lade op", "En kort pause eller en god nats søvn kan give ny energi til problemet.", "breaks"),
  reaction("sort", "Skab orden", "Vælg sortering bevidst, så resultatets rækkefølge er tydelig og relevant.", "sql"),
  reaction("success", "Kørslen lykkedes", "Databasen kunne køre din SQL; undersøg stadig, om resultatet opfylder kravene.", "feedback"),
  reaction("surprised", "Det havde jeg ikke ventet", "Et overraskende resultat kan afsløre en vigtig antagelse om dine data.", "feedback"),
  reaction("tea-time", "Tepause", "Lad tankerne falde på plads, og vend tilbage med et konkret næste spørgsmål.", "breaks"),
  reaction("testing", "Bevis at det virker", "Beskriv et forventet resultat, og afprøv både gyldige og ugyldige værdier.", "sql"),
  reaction("thinking", "Lad os tænke", "Beskriv først, hvad du vil finde eller ændre, før du skriver mere kode.", "learning"),
  reaction("thumbs-up", "Du er på vej", "Byg videre på det, der virker, og forklar hvorfor dit næste trin giver mening.", "feedback"),
  reaction("transaction", "Alt eller intet", "Saml afhængige ændringer, så de kan gennemføres eller rulles tilbage sammen.", "sql"),
  reaction("typing", "Der arbejdes", "Raymond følger med, mens din forespørgsel bliver behandlet.", "sql"),
  reaction("warning", "Stop og undersøg", "Læs betingelser og konsekvenser, før du ændrer eller fjerner data.", "feedback"),
  reaction("wave", "Hej med dig", "Velkommen til et nyt trin sammen med Raymond, din SQL-guide.", "breaks"),
] as const;

export type RaymondReaction = (typeof raymondReactions)[number];
export type RaymondReactionId = RaymondReaction["id"];

const reactionsById = new Map<string, RaymondReaction>(raymondReactions.map((item) => [item.id, item]));

/** Unknown IDs fall back to a calm ready state, never an invented success or error. */
export function getRaymondReaction(id: string | null | undefined): RaymondReaction {
  return reactionsById.get(id ?? "") ?? reactionsById.get("query-ready")!;
}

export const raymondMoodReactions = {
  neutral: "query-ready",
  success: "success",
  error: "debugging",
  help: "help",
  thinking: "typing",
  warning: "warning",
  celebration: "applause",
} as const satisfies Record<RaymondMood, RaymondReactionId>;
