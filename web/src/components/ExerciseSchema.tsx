import { useMemo, useState } from "react";
import hljs from "highlight.js/lib/core";
import sqlLang from "highlight.js/lib/languages/sql";
import type { SeedSchema } from "../api";

hljs.registerLanguage("sql", sqlLang);

type Props = {
  schema: SeedSchema;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function ExerciseSchema({ schema }: Props) {
  const [ddlOpen, setDdlOpen] = useState(false);
  const [active, setActive] = useState(schema.tables[0]?.name ?? "");

  const highlighted = useMemo(() => {
    try {
      return hljs.highlight(schema.ddl, { language: "sql" }).value;
    } catch {
      return escapeHtml(schema.ddl);
    }
  }, [schema.ddl]);

  const table = schema.tables.find((t) => t.name === active) ?? schema.tables[0];
  if (!table) return null;

  const fks = schema.relations.filter((r) => r.fromTable === table.name);

  return (
    <section className="ex-schema" aria-label="Database-schema til opgaven">
      <div className="ex-schema-head">
        <div>
          <strong>Schema</strong>
          <span className="ex-schema-sub">
            {schema.tables.length} tabeller
            {schema.relations.length > 0 ? ` · ${schema.relations.length} relationer` : ""}
          </span>
        </div>
        <button
          type="button"
          className={`btn ghost ex-schema-ddl-btn ${ddlOpen ? "active" : ""}`}
          aria-expanded={ddlOpen}
          onClick={() => setDdlOpen((v) => !v)}
        >
          {ddlOpen ? "Skjul SQL" : "Vis CREATE TABLE"}
        </button>
      </div>

      <div className="ex-schema-tabs" role="tablist" aria-label="Tabeller">
        {schema.tables.map((t) => (
          <button
            key={t.name}
            type="button"
            role="tab"
            aria-selected={t.name === table.name}
            className={t.name === table.name ? "active" : ""}
            onClick={() => setActive(t.name)}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="ex-schema-table-wrap">
        <table className="ex-schema-table">
          <thead>
            <tr>
              <th>Kolonne</th>
              <th>Type</th>
              <th>Nøgle</th>
            </tr>
          </thead>
          <tbody>
            {table.columns.map((c) => (
              <tr key={c.name}>
                <td>
                  <code>{c.name}</code>
                  {c.nullable ? <span className="ex-schema-null">NULL</span> : null}
                </td>
                <td className="ex-schema-type">{c.dataType}</td>
                <td className="ex-schema-keys">
                  {c.isPrimaryKey && <span className="ex-badge pk">PK</span>}
                  {c.isForeignKey && <span className="ex-badge fk">FK</span>}
                  {!c.isPrimaryKey && !c.isForeignKey && <span className="muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {fks.length > 0 && (
        <p className="ex-schema-rels">
          {fks.map((r) => (
            <span key={`${r.fromColumn}-${r.toTable}`}>
              <code>
                {r.fromTable}.{r.fromColumn}
              </code>{" "}
              →{" "}
              <code>
                {r.toTable}.{r.toColumn}
              </code>
            </span>
          ))}
        </p>
      )}

      {ddlOpen && (
        <div className="ex-schema-ddl">
          <pre>
            <code className="hljs language-sql" dangerouslySetInnerHTML={{ __html: highlighted }} />
          </pre>
        </div>
      )}
    </section>
  );
}
