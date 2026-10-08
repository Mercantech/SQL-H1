import { useMemo, useState } from "react";
import {
  joinCustomersOrders,
  leftJoinProductsOrders,
  type JoinKind,
} from "./joinDemoData";

const KINDS: { id: JoinKind; label: string; hint: string }[] = [
  { id: "inner", label: "INNER", hint: "Kun match — begge sider skal være enige." },
  { id: "left", label: "LEFT", hint: "Alle fra venstre + match. Mangler → NULL." },
  { id: "right", label: "RIGHT", hint: "Alle fra højre + match. Sjældent brugt." },
  { id: "full", label: "FULL", hint: "Alle fra begge sider. Huller → NULL." },
];

type Props = {
  onInsert?: (sql: string) => void;
};

const SQL_BY_KIND: Record<JoinKind, string> = {
  inner: `SELECT c.name, o.id AS ordre_id
FROM customers c
INNER JOIN orders o ON o.customer_id = c.id;`,
  left: `SELECT c.name, o.id AS ordre_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;`,
  right: `SELECT c.name, o.id AS ordre_id
FROM customers c
RIGHT JOIN orders o ON o.customer_id = c.id;`,
  full: `SELECT c.name, o.id AS ordre_id
FROM customers c
FULL OUTER JOIN orders o ON o.customer_id = c.id;`,
};

export function JoinTypeExplorer({ onInsert }: Props) {
  const [kind, setKind] = useState<JoinKind>("inner");
  const [mode, setMode] = useState<"customers" | "products">("customers");

  const rows = useMemo(() => {
    if (mode === "products") return leftJoinProductsOrders();
    return joinCustomersOrders(kind);
  }, [kind, mode]);

  const active = KINDS.find((k) => k.id === kind)!;

  return (
    <div className="join-viz" data-widget="types">
      <div className="join-viz-head">
        <strong>Prøv join-typerne</strong>
        <span className="join-viz-sub">Klik og se, hvilke rækker der overlever</span>
      </div>

      <div className="join-viz-mode" role="tablist" aria-label="Datasæt">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "customers"}
          className={mode === "customers" ? "active" : ""}
          onClick={() => setMode("customers")}
        >
          Kunder ⋈ Ordrer
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "products"}
          className={mode === "products" ? "active" : ""}
          onClick={() => {
            setMode("products");
            setKind("left");
          }}
        >
          Produkter ⋈ Ordrer
        </button>
      </div>

      {mode === "customers" && (
        <div className="join-viz-kinds" role="group" aria-label="Join-type">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`join-kind-btn ${kind === k.id ? "active" : ""}`}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      <p className="join-viz-hint">{mode === "products" ? "LEFT JOIN — Croissant har ingen ordrer." : active.hint}</p>

      <div className="join-venn-wrap">
        <JoinVenn kind={mode === "products" ? "left" : kind} left="Venstre" right="Højre" />
      </div>

      <div className="join-result-table-wrap">
        <table className="join-result-table">
          <thead>
            <tr>
              <th>{mode === "products" ? "Produkt" : "Kunde"}</th>
              <th>{mode === "products" ? "Ordre" : "Ordre / produkt"}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mode === "products"
              ? (rows as ReturnType<typeof leftJoinProductsOrders>).map((r, i) => (
                  <tr key={i} className={r.matched ? "matched" : "null-row"}>
                    <td>{r.product}</td>
                    <td className={!r.matched ? "is-null" : ""}>{r.orderLabel}</td>
                    <td>{r.matched ? "match" : "NULL"}</td>
                  </tr>
                ))
              : (rows as ReturnType<typeof joinCustomersOrders>).map((r, i) => (
                  <tr key={i} className={r.matched ? "matched" : "null-row"}>
                    <td className={!r.fromLeft ? "is-null" : ""}>{r.leftLabel}</td>
                    <td className={!r.fromRight ? "is-null" : ""}>{r.rightLabel}</td>
                    <td>{r.matched ? "match" : "NULL"}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {onInsert && mode === "customers" && (
        <div className="join-viz-actions">
          <button type="button" className="btn" onClick={() => onInsert(SQL_BY_KIND[kind])}>
            Indsæt SQL i editor
          </button>
        </div>
      )}
      {onInsert && mode === "products" && (
        <div className="join-viz-actions">
          <button
            type="button"
            className="btn"
            onClick={() =>
              onInsert(`SELECT p.name, o.id AS ordre_id
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
ORDER BY p.name;`)
            }
          >
            Indsæt SQL i editor
          </button>
        </div>
      )}
    </div>
  );
}

function JoinVenn({ kind, left, right }: { kind: JoinKind; left: string; right: string }) {
  const showLeftOnly = kind === "left" || kind === "full";
  const showRightOnly = kind === "right" || kind === "full";

  return (
    <svg className="join-venn" viewBox="0 0 320 160" role="img" aria-label={`Venn-diagram for ${kind} JOIN`}>
      <defs>
        <clipPath id={`venn-clip-L-${kind}`}>
          <circle cx="118" cy="80" r="58" />
        </clipPath>
      </defs>

      <circle
        cx="118"
        cy="80"
        r="58"
        className={`venn-fill left ${showLeftOnly ? "on" : "off"}`}
      />
      <circle
        cx="202"
        cy="80"
        r="58"
        className={`venn-fill right ${showRightOnly ? "on" : "off"}`}
      />
      <g clipPath={`url(#venn-clip-L-${kind})`}>
        <circle cx="202" cy="80" r="58" className="venn-fill inner on" />
      </g>

      <circle cx="118" cy="80" r="58" className="venn-ring" fill="none" />
      <circle cx="202" cy="80" r="58" className="venn-ring" fill="none" />

      <text x="72" y="84" className="venn-label">
        {left}
      </text>
      <text x="248" y="84" className="venn-label" textAnchor="middle">
        {right}
      </text>
      <text x="160" y="84" className="venn-label-center" textAnchor="middle">
        match
      </text>
    </svg>
  );
}
