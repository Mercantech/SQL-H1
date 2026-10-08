import type { InspectRelation, InspectTable } from "../api";

type Props = {
  tables: InspectTable[];
  relations: InspectRelation[];
  onSelectTable?: (name: string) => void;
  selected?: string | null;
};

function cardinalityLabel(fromTable: string, toTable: string, relations: InspectRelation[]) {
  const forward = relations.some((r) => r.fromTable === fromTable && r.toTable === toTable);
  const back = relations.some((r) => r.fromTable === toTable && r.toTable === fromTable);
  if (forward && !back) return { left: "1", right: "n" };
  if (back && !forward) return { left: "n", right: "1" };
  return { left: "n", right: "n" };
}

export function ErDiagram({ tables, relations, onSelectTable, selected }: Props) {
  if (tables.length === 0) return null;

  const byName = new Map(tables.map((t) => [t.name, t]));
  const preferred = ["customers", "orders", "products"];
  const ordered = [
    ...preferred.filter((n) => byName.has(n)),
    ...tables.map((t) => t.name).filter((n) => !preferred.includes(n)),
  ];

  return (
    <section className="er-diagram" aria-labelledby="er-title">
      <header className="er-head">
        <h2 id="er-title">ER-diagram</h2>
        <p className="muted">
          Visuel model af dine tabeller. PK = primærnøgle, FK = fremmednøgle. Klik en tabel for detaljer.
        </p>
      </header>

      <div className="er-canvas" role="img" aria-label="Entity-relationship diagram">
        <div className="er-entities">
          {ordered.map((name) => {
            const table = byName.get(name)!;
            return (
              <button
                key={name}
                type="button"
                className={`er-entity ${selected === name ? "active" : ""}`}
                onClick={() => onSelectTable?.(name)}
              >
                <div className="er-entity-head">
                  <span className="er-entity-name">{name}</span>
                  <span className="er-entity-count">{table.rowCount} rækker</span>
                </div>
                <ul className="er-attrs">
                  {table.columns.map((c) => (
                    <li key={c.name} className={c.isPrimaryKey ? "pk" : c.isForeignKey ? "fk" : ""}>
                      <span className="er-attr-flags">
                        {c.isPrimaryKey && <abbr title="Primærnøgle">PK</abbr>}
                        {c.isForeignKey && <abbr title="Fremmednøgle">FK</abbr>}
                      </span>
                      <code>{c.name}</code>
                      <span className="er-attr-type">{c.dataType}</span>
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {relations.length > 0 && (
          <ul className="er-relations">
            {relations.map((r) => {
              const card = cardinalityLabel(r.toTable, r.fromTable, relations);
              return (
                <li key={`${r.fromTable}.${r.fromColumn}-${r.toTable}.${r.toColumn}`}>
                  <button type="button" className="er-rel-link" onClick={() => onSelectTable?.(r.toTable)}>
                    <code>{r.toTable}</code>
                  </button>
                  <span className="er-crow" aria-hidden="true">
                    <span className="er-card">{card.left}</span>
                    <span className="er-line" />
                    <span className="er-card">{card.right}</span>
                  </span>
                  <button type="button" className="er-rel-link" onClick={() => onSelectTable?.(r.fromTable)}>
                    <code>{r.fromTable}</code>
                  </button>
                  <span className="er-rel-cols muted">
                    {r.toTable}.{r.toColumn} ← {r.fromTable}.{r.fromColumn}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="er-legend muted">
        Typisk café-model: én kunde har mange ordrer (1:n), ét produkt indgår i mange ordrer (1:n).{" "}
        <code>orders</code> er koblingstabellen mellem kunder og produkter.
      </p>
    </section>
  );
}
