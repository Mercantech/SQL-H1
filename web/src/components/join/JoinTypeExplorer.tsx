import { useId, useMemo, useState } from "react";
import {
  joinCustomersOrders,
  leftJoinProductsOrders,
  type JoinKind,
} from "./joinDemoData";

type Zone = "left" | "inner" | "right";

const KINDS: { id: JoinKind; label: string; hint: string; zones: Zone[] }[] = [
  {
    id: "inner",
    label: "INNER",
    hint: "Kun overlap — begge sider skal matche.",
    zones: ["inner"],
  },
  {
    id: "left",
    label: "LEFT",
    hint: "Hele venstre + overlap. Mangler match → NULL.",
    zones: ["left", "inner"],
  },
  {
    id: "right",
    label: "RIGHT",
    hint: "Hele højre + overlap. Sjældent brugt i praksis.",
    zones: ["inner", "right"],
  },
  {
    id: "full",
    label: "FULL",
    hint: "Alt fra begge sider. Huller bliver NULL.",
    zones: ["left", "inner", "right"],
  },
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

function rowZones(matched: boolean, fromLeft: boolean, fromRight: boolean): Zone[] {
  if (matched) return ["inner"];
  if (fromLeft && !fromRight) return ["left"];
  if (!fromLeft && fromRight) return ["right"];
  return ["inner"];
}

export function JoinTypeExplorer({ onInsert }: Props) {
  const [kind, setKind] = useState<JoinKind>("inner");
  const [mode, setMode] = useState<"customers" | "products">("customers");
  const [hoverKind, setHoverKind] = useState<JoinKind | null>(null);
  const [hoverZone, setHoverZone] = useState<Zone | null>(null);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  const displayKind = mode === "products" ? "left" : (hoverKind ?? kind);
  const previewMeta = KINDS.find((k) => k.id === displayKind)!;

  const customerRows = useMemo(() => joinCustomersOrders(displayKind), [displayKind]);
  const productRows = useMemo(() => leftJoinProductsOrders(), []);

  const leftLabel = mode === "products" ? "products" : "customers";
  const rightLabel = "orders";

  const leftOnlyCount =
    mode === "products"
      ? productRows.filter((r) => !r.matched).length
      : customerRows.filter((r) => r.fromLeft && !r.fromRight).length;
  const matchCount =
    mode === "products"
      ? productRows.filter((r) => r.matched).length
      : customerRows.filter((r) => r.matched).length;
  const rightOnlyCount =
    mode === "products" ? 0 : customerRows.filter((r) => !r.fromLeft && r.fromRight).length;

  function zoneActive(zone: Zone) {
    return previewMeta.zones.includes(zone);
  }

  function rowHighlighted(index: number, zones: Zone[]) {
    if (hoverRow === index) return true;
    if (hoverZone && zones.includes(hoverZone)) return true;
    return false;
  }

  function rowDimmed(index: number, zones: Zone[]) {
    if (hoverRow != null && hoverRow !== index) return true;
    if (hoverZone && !zones.includes(hoverZone)) return true;
    return false;
  }

  return (
    <div className="join-viz" data-widget="types">
      <div className="join-viz-head">
        <strong>Prøv join-typerne</strong>
        <span className="join-viz-sub">
          Hold musen over knapper, zoner eller rækker — se hvad der overlever
        </span>
      </div>

      <div className="join-viz-mode" role="tablist" aria-label="Datasæt">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "customers"}
          className={mode === "customers" ? "active" : ""}
          onClick={() => {
            setMode("customers");
            setHoverZone(null);
            setHoverRow(null);
          }}
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
            setHoverKind(null);
            setHoverZone(null);
            setHoverRow(null);
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
              className={`join-kind-btn ${kind === k.id ? "active" : ""} ${
                hoverKind === k.id && kind !== k.id ? "preview" : ""
              }`}
              onClick={() => setKind(k.id)}
              onMouseEnter={() => setHoverKind(k.id)}
              onMouseLeave={() => setHoverKind(null)}
              onFocus={() => setHoverKind(k.id)}
              onBlur={() => setHoverKind(null)}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      <p className="join-viz-hint">
        {mode === "products" ? "LEFT JOIN — Croissant har ingen ordrer." : previewMeta.hint}
        {hoverKind && hoverKind !== kind && mode === "customers" && (
          <span className="join-viz-preview-tag"> forhåndsvisning</span>
        )}
      </p>

      <div className="join-venn-wrap">
        <JoinVenn
          kind={displayKind}
          left={leftLabel}
          right={rightLabel}
          leftOnlyCount={leftOnlyCount}
          matchCount={matchCount}
          rightOnlyCount={rightOnlyCount}
          hoverZone={hoverZone}
          onHoverZone={setHoverZone}
          zoneActive={zoneActive}
        />
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
              ? productRows.map((r, i) => {
                  const zones = rowZones(r.matched, true, r.matched);
                  return (
                    <tr
                      key={i}
                      className={`${r.matched ? "matched" : "null-row"} ${
                        rowHighlighted(i, zones) ? "hl" : ""
                      } ${rowDimmed(i, zones) ? "dim" : ""}`}
                      onMouseEnter={() => {
                        setHoverRow(i);
                        setHoverZone(zones[0] ?? null);
                      }}
                      onMouseLeave={() => {
                        setHoverRow(null);
                        setHoverZone(null);
                      }}
                    >
                      <td>{r.product}</td>
                      <td className={!r.matched ? "is-null" : ""}>{r.orderLabel}</td>
                      <td>{r.matched ? "match" : "NULL"}</td>
                    </tr>
                  );
                })
              : customerRows.map((r, i) => {
                  const zones = rowZones(r.matched, r.fromLeft, r.fromRight);
                  return (
                    <tr
                      key={i}
                      className={`${r.matched ? "matched" : "null-row"} ${
                        rowHighlighted(i, zones) ? "hl" : ""
                      } ${rowDimmed(i, zones) ? "dim" : ""}`}
                      onMouseEnter={() => {
                        setHoverRow(i);
                        setHoverZone(zones[0] ?? null);
                      }}
                      onMouseLeave={() => {
                        setHoverRow(null);
                        setHoverZone(null);
                      }}
                    >
                      <td className={!r.fromLeft ? "is-null" : ""}>{r.leftLabel}</td>
                      <td className={!r.fromRight ? "is-null" : ""}>{r.rightLabel}</td>
                      <td>{r.matched ? "match" : "NULL"}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <p className="join-viz-legend">
        <span>
          <i className="join-dot left" /> kun {leftLabel}
        </span>
        <span>
          <i className="join-dot inner" /> match
        </span>
        <span>
          <i className="join-dot right" /> kun {rightLabel}
        </span>
      </p>

      {onInsert && (
        <div className="join-viz-actions">
          <button
            type="button"
            className="btn"
            onClick={() =>
              onInsert(
                mode === "products"
                  ? `SELECT p.name, o.id AS ordre_id
FROM products p
LEFT JOIN orders o ON o.product_id = p.id
ORDER BY p.name;`
                  : SQL_BY_KIND[kind],
              )
            }
          >
            Indsæt SQL i editor
          </button>
        </div>
      )}

    </div>
  );
}

type VennProps = {
  kind: JoinKind;
  left: string;
  right: string;
  leftOnlyCount: number;
  matchCount: number;
  rightOnlyCount: number;
  hoverZone: Zone | null;
  onHoverZone: (z: Zone | null) => void;
  zoneActive: (z: Zone) => boolean;
};

function JoinVenn({
  kind,
  left,
  right,
  leftOnlyCount,
  matchCount,
  rightOnlyCount,
  hoverZone,
  onHoverZone,
  zoneActive,
}: VennProps) {
  const uid = useId().replace(/:/g, "");
  const clipL = `venn-clip-L-${uid}`;
  const gradL = `venn-grad-L-${uid}`;
  const gradR = `venn-grad-R-${uid}`;
  const gradI = `venn-grad-I-${uid}`;
  const filterId = `venn-soft-${uid}`;

  function zoneClass(zone: Zone) {
    const on = zoneActive(zone);
    const hover = hoverZone === zone;
    return `venn-zone ${zone} ${on ? "on" : "off"} ${hover ? "hover" : ""} ${
      hoverZone && !hover ? "fade" : ""
    }`;
  }

  return (
    <svg
      className={`join-venn kind-${kind}`}
      viewBox="0 0 360 200"
      role="img"
      aria-label={`Venn-diagram for ${kind} JOIN`}
    >
      <defs>
        <linearGradient id={gradL} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2f8f63" />
          <stop offset="100%" stopColor="#1f6b4a" />
        </linearGradient>
        <linearGradient id={gradR} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4783a" />
          <stop offset="100%" stopColor="#c45c26" />
        </linearGradient>
        <linearGradient id={gradI} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3a9b6a" />
          <stop offset="100%" stopColor="#1b5c3f" />
        </linearGradient>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#152018" floodOpacity="0.12" />
        </filter>
        <clipPath id={clipL}>
          <circle cx="132" cy="96" r="70" />
        </clipPath>
      </defs>

      {/* Soft base discs */}
      <circle cx="132" cy="96" r="70" className="venn-base left" filter={`url(#${filterId})`} />
      <circle cx="228" cy="96" r="70" className="venn-base right" filter={`url(#${filterId})`} />

      {/* Interactive fills */}
      <circle
        cx="132"
        cy="96"
        r="70"
        className={zoneClass("left")}
        style={{ fill: `url(#${gradL})` }}
        onMouseEnter={() => onHoverZone("left")}
        onMouseLeave={() => onHoverZone(null)}
      />
      <circle
        cx="228"
        cy="96"
        r="70"
        className={zoneClass("right")}
        style={{ fill: `url(#${gradR})` }}
        onMouseEnter={() => onHoverZone("right")}
        onMouseLeave={() => onHoverZone(null)}
      />
      <g clipPath={`url(#${clipL})`}>
        <circle
          cx="228"
          cy="96"
          r="70"
          className={zoneClass("inner")}
          style={{ fill: `url(#${gradI})` }}
          onMouseEnter={() => onHoverZone("inner")}
          onMouseLeave={() => onHoverZone(null)}
        />
      </g>

      <circle cx="132" cy="96" r="70" className="venn-ring" fill="none" />
      <circle cx="228" cy="96" r="70" className="venn-ring" fill="none" />

      {/* Hit targets for clearer hover on lobes */}
      <path
        d="M 132 26 A 70 70 0 0 0 132 166 A 70 70 0 0 1 132 26"
        className="venn-hit"
        onMouseEnter={() => onHoverZone("left")}
        onMouseLeave={() => onHoverZone(null)}
      />
      <path
        d="M 228 26 A 70 70 0 0 1 228 166 A 70 70 0 0 0 228 26"
        className="venn-hit"
        onMouseEnter={() => onHoverZone("right")}
        onMouseLeave={() => onHoverZone(null)}
      />
      <ellipse
        cx="180"
        cy="96"
        rx="28"
        ry="48"
        className="venn-hit"
        onMouseEnter={() => onHoverZone("inner")}
        onMouseLeave={() => onHoverZone(null)}
      />

      <text x="88" y="100" className="venn-label" textAnchor="middle">
        {left}
      </text>
      <text x="272" y="100" className="venn-label" textAnchor="middle">
        {right}
      </text>
      <text x="180" y="102" className="venn-label-center" textAnchor="middle">
        match
      </text>

      <g className={`venn-count left ${zoneActive("left") ? "on" : "off"}`}>
        <rect x="48" y="148" width="56" height="22" rx="11" />
        <text x="76" y="163" textAnchor="middle">
          {leftOnlyCount} kun
        </text>
      </g>
      <g className={`venn-count inner ${zoneActive("inner") ? "on" : "off"}`}>
        <rect x="152" y="148" width="56" height="22" rx="11" />
        <text x="180" y="163" textAnchor="middle">
          {matchCount} hit
        </text>
      </g>
      <g className={`venn-count right ${zoneActive("right") ? "on" : "off"}`}>
        <rect x="256" y="148" width="56" height="22" rx="11" />
        <text x="284" y="163" textAnchor="middle">
          {rightOnlyCount} kun
        </text>
      </g>
    </svg>
  );
}
