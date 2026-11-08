import type { RaymondReactionId } from "./raymondReactions";

const moduleReactions: Record<string, RaymondReactionId> = {
  select: "filter",
  dml: "typing",
  "joins-subqueries": "join",
  relations: "foreign-key",
  constraints: "primary-key",
  "ddl-er": "idea-notes",
  views: "reading",
  advanced: "transaction",
  procedures: "typing",
  triggers: "focused",
  drift: "backup",
  adonet: "query-ready",
  dapper: "join",
  orm: "normalize",
  documents: "curious",
  "database-choice": "performance",
  security: "safe-lock",
  testing: "testing",
};

export function getModuleReaction(moduleSlug: string): RaymondReactionId {
  return moduleReactions[moduleSlug] ?? "reading";
}
