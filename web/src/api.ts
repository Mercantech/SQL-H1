import { apiFetch, publicFetch } from "./auth";

export type ModuleDto = {
  slug: string;
  title: string;
  description: string;
  order: number;
  scaffoldOnly: boolean;
  objectives: string[];
  items: { slug: string; title: string; kind: string; order: number }[];
};

export type SchemaColumn = {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  referencesTable?: string | null;
  referencesColumn?: string | null;
};

export type SchemaTable = {
  name: string;
  columns: SchemaColumn[];
};

export type SchemaRelation = {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
};

export type SeedSchema = {
  ddl: string;
  tables: SchemaTable[];
  relations: SchemaRelation[];
};

export type ContentDto = {
  slug: string;
  title: string;
  module: string;
  order: number;
  kind: string;
  objectives: string[];
  markdown: string;
  html: string;
  sandbox?: {
    seed?: string;
    allowWrite: boolean;
    checksPath?: string;
    starterSql?: string;
  } | null;
  schema?: SeedSchema | null;
};

export type ResultSet = {
  label: string;
  columns: string[];
  rows: unknown[][];
  rowsAffected?: number;
  truncated?: boolean;
};

export type ExecuteResult = {
  ok: boolean;
  columns: string[];
  rows: unknown[][];
  rowsAffected?: number;
  error?: string;
  truncated?: boolean;
  sets?: ResultSet[];
};

export type ProgressRow = {
  contentSlug: string;
  partIndex: number;
  status: string;
  updatedAt: string;
};

export type MeDto = {
  sub: string;
  displayName: string;
  email?: string;
  sandbox: { status: string; dbName?: string };
};

export async function fetchModules(): Promise<ModuleDto[]> {
  const res = await publicFetch("/modules");
  if (!res.ok) throw new Error("Kunne ikke hente moduler");
  return res.json();
}

export async function fetchContent(slug: string): Promise<ContentDto> {
  const res = await publicFetch(`/content/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("Indhold ikke fundet");
  return res.json();
}

export async function fetchMe(): Promise<MeDto> {
  const res = await apiFetch("/me");
  if (!res.ok) throw new Error("Kunne ikke hente profil");
  return res.json();
}

export async function provisionSandbox() {
  const res = await apiFetch("/sandbox/provision", { method: "POST", body: "{}" });
  if (!res.ok) throw new Error("Kunne ikke oprette elev-database");
  return res.json();
}

export async function executeSql(sql: string, contentSlug?: string, allowWrite?: boolean) {
  const res = await apiFetch("/sandbox/execute", {
    method: "POST",
    body: JSON.stringify({ sql, contentSlug, allowWrite }),
  });
  return (await res.json()) as ExecuteResult;
}

export async function resetSandbox(contentSlug?: string) {
  const res = await apiFetch("/sandbox/reset", {
    method: "POST",
    body: JSON.stringify({ contentSlug }),
  });
  if (!res.ok) throw new Error("Nulstil fejlede");
  return res.json();
}

export async function checkExercise(contentSlug: string) {
  const res = await apiFetch("/sandbox/check", {
    method: "POST",
    body: JSON.stringify({ contentSlug }),
  });
  return (await res.json()) as { passed: boolean; messages: string[] };
}

export type InspectColumn = {
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
};

export type InspectRelation = {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
};

export type InspectTable = {
  name: string;
  columns: InspectColumn[];
  rowCount: number;
  baselineRowCount?: number | null;
  diffStatus: "unchanged" | "changed" | "extra" | "missing" | string;
  previewColumns: string[];
  previewRows: unknown[][];
  previewTruncated?: boolean;
  addedColumns?: string[] | null;
  addedRows?: unknown[][] | null;
  removedColumns?: string[] | null;
  removedRows?: unknown[][] | null;
};

export type InspectResult = {
  dbName: string;
  status: string;
  baselineLabel: string;
  matchesBaseline: boolean;
  tables: InspectTable[];
  baselineOnlyTables: string[];
  relations?: InspectRelation[];
};

export async function fetchSandboxInspect(contentSlug?: string): Promise<InspectResult> {
  const q = contentSlug ? `?contentSlug=${encodeURIComponent(contentSlug)}` : "";
  const res = await apiFetch(`/sandbox/inspect${q}`);
  if (!res.ok) throw new Error("Kunne ikke hente database-overblik");
  return res.json();
}

export type QueryHistoryItem = {
  id: number;
  sql: string;
  contentSlug?: string | null;
  ok: boolean;
  error?: string | null;
  createdAt: string;
};

export async function fetchQueryHistory(limit = 40): Promise<QueryHistoryItem[]> {
  const res = await apiFetch(`/sandbox/history?limit=${limit}`);
  if (!res.ok) throw new Error("Kunne ikke hente SQL-historik");
  return res.json();
}

export async function deleteQueryHistoryItem(id: number) {
  const res = await apiFetch(`/sandbox/history/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Kunne ikke slette historik");
}

export async function fetchProgress(): Promise<ProgressRow[]> {
  const res = await apiFetch("/progress");
  if (!res.ok) throw new Error("Kunne ikke hente progress");
  return res.json();
}

export async function putProgress(slug: string, status: string) {
  const res = await apiFetch(`/progress/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify({ partIndex: 0, status }),
  });
  if (!res.ok) throw new Error("Kunne ikke gemme progress");
}
