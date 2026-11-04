import { MURDER_SEED_SQL, MURDER_TABLES } from "./seed.ts";

export type SchemaRelation = {
  id: string;
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  /** Parent:child cardinality; the relation itself points from the FK child to its parent. */
  cardinality: "1:1" | "1:n";
};

export const MURDER_RELATIONS: SchemaRelation[] = MURDER_TABLES.flatMap((table) => {
  const primaryKeyColumns = table.columns.filter((column) => column.key === "PK");
  return table.columns.flatMap((column): SchemaRelation[] => {
    if (!column.references) return [];
    const [toTable, toColumn] = column.references.split(".");
    return [{
      id: `${table.name}.${column.name}->${toTable}.${toColumn}`,
      fromTable: table.name,
      fromColumn: column.name,
      toTable,
      toColumn,
      cardinality: column.key === "PK" && primaryKeyColumns.length === 1 ? "1:1" : "1:n",
    }];
  });
});

function splitDefinitions(body: string): string[] {
  const definitions: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let index = 0; index < body.length; index++) {
    const character = body[index];
    if (quote) {
      if (character === quote) {
        if (quote !== "]" && body[index + 1] === quote) index++;
        else quote = "";
      }
      continue;
    }
    if (character === "'" || character === '"' || character === "`") quote = character;
    else if (character === "[") quote = "]";
    else if (character === "(") depth++;
    else if (character === ")") depth--;
    else if (character === "," && depth === 0) {
      definitions.push(body.slice(start, index).trim());
      start = index + 1;
    }
  }
  definitions.push(body.slice(start).trim());
  return definitions;
}

/** Read the actual table definition without including story rows or the solution. */
export function getMurderDdl(tableName: string): string {
  if (!MURDER_TABLES.some((table) => table.name === tableName)) {
    throw new Error(`Ukendt tabel: ${tableName}`);
  }
  const definition = new RegExp(`^CREATE\\s+TABLE\\s+${tableName}\\s*\\(([\\s\\S]*?)\\);`, "m").exec(MURDER_SEED_SQL);
  if (!definition) throw new Error(`Tabeldefinitionen for ${tableName} mangler.`);
  const columns = splitDefinitions(definition[1]);
  return `CREATE TABLE ${tableName} (\n${columns.map((column) => `  ${column}`).join(",\n")}\n);`;
}
