export const courseMissions: Record<string, { image: string; alt: string; challenge: string }> = {
  orm: { image: "orm", alt: "Raymond tegner og tager noter til en objektmodel", challenge: "Fra C#-objekter til rigtig SQL" },
  documents: { image: "documents", alt: "Raymond er klar til at undersøge dokumentdata", challenge: "Giv spillernes profiler plads til forskelle" },
  "database-choice": { image: "choice", alt: "Raymond måler tiden med et lommeur", challenge: "Mål først. Vælg bagefter." },
  security: { image: "security", alt: "Raymond beskytter data med et skjold og en lås", challenge: "Luk hullerne, før GameHub åbner" },
  testing: { image: "testing", alt: "Raymond undersøger et grønt flueben", challenge: "Bevis, at databasen holder til virkeligheden" },
};

export function contentKindLabel(kind: string) {
  return kind === "project" ? "Projekt" : kind === "exercise" ? "SQL-opgave" : "Teori";
}

export function progressLabel(kind: string | undefined, status: string) {
  if (status !== "completed") return status === "started" ? "I gang" : status;
  return kind === "project" ? "Klar til gennemgang" : kind === "theory" ? "Teori åbnet" : kind === "exercise" ? "Bestået" : "Fuldført";
}
