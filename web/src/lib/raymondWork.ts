import type { ExecuteResult } from "../api";

/** Share only result metadata: row values are deliberately not included. */
export function describeSqlResult(result: ExecuteResult | null): string | undefined {
  if (!result) return undefined;
  const sets = result.sets?.length ? result.sets : [result];
  const details = sets.slice(0, 3).map((set, index) => {
    const columns = set.columns?.slice(0, 20).join(", ") || "ingen resultatkolonner";
    return `Resultat ${index + 1}: ${columns}; ${set.rows?.length ?? 0} viste rækker${set.rowsAffected != null ? `; ${set.rowsAffected} berørte rækker` : ""}${set.truncated ? "; resultatet er afkortet" : ""}.`;
  });
  return `${result.ok ? "SQL-kørslen lykkedes" : "SQL-kørslen fejlede"}. ${details.join(" ")}`.slice(0, 1200);
}
