import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { InspectRelation, InspectTable } from "../api";

type Props = {
  tables: InspectTable[];
  relations: InspectRelation[];
  onSelectTable?: (name: string) => void;
  selected?: string | null;
};

type Point = { x: number; y: number };

type Arrow = {
  key: string;
  d: string;
  labelX: number;
  labelY: number;
  label: string;
};

function edgePoint(from: DOMRect, to: DOMRect, canvas: DOMRect): { start: Point; end: Point } {
  const fromC = {
    x: from.left + from.width / 2 - canvas.left,
    y: from.top + from.height / 2 - canvas.top,
  };
  const toC = {
    x: to.left + to.width / 2 - canvas.left,
    y: to.top + to.height / 2 - canvas.top,
  };

  const dx = toC.x - fromC.x;
  const dy = toC.y - fromC.y;

  if (Math.abs(dx) >= Math.abs(dy) * 0.6) {
    if (dx >= 0) {
      return {
        start: { x: from.right - canvas.left, y: fromC.y },
        end: { x: to.left - canvas.left, y: toC.y },
      };
    }
    return {
      start: { x: from.left - canvas.left, y: fromC.y },
      end: { x: to.right - canvas.left, y: toC.y },
    };
  }

  if (dy >= 0) {
    return {
      start: { x: fromC.x, y: from.bottom - canvas.top },
      end: { x: toC.x, y: to.top - canvas.top },
    };
  }
  return {
    start: { x: fromC.x, y: from.top - canvas.top },
    end: { x: toC.x, y: to.bottom - canvas.top },
  };
}

function curvePath(start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const mid = start.x + dx / 2;
    return `M ${start.x} ${start.y} C ${mid} ${start.y}, ${mid} ${end.y}, ${end.x} ${end.y}`;
  }
  const mid = start.y + dy / 2;
  return `M ${start.x} ${start.y} C ${start.x} ${mid}, ${end.x} ${mid}, ${end.x} ${end.y}`;
}

export function ErDiagram({ tables, relations, onSelectTable, selected }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const entityRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [arrows, setArrows] = useState<Arrow[]>([]);

  const ordered = useMemo(() => {
    const byName = new Map(tables.map((t) => [t.name, t]));
    const preferred = ["customers", "orders", "products"];
    return [
      ...preferred.filter((n) => byName.has(n)),
      ...tables.map((t) => t.name).filter((n) => !preferred.includes(n)),
    ];
  }, [tables]);

  const byName = useMemo(() => new Map(tables.map((t) => [t.name, t])), [tables]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || tables.length === 0) {
      setArrows([]);
      return;
    }

    const redraw = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const next: Arrow[] = [];

      for (const rel of relations) {
        const parentEl = entityRefs.current[rel.toTable];
        const childEl = entityRefs.current[rel.fromTable];
        if (!parentEl || !childEl) continue;

        const { start, end } = edgePoint(
          parentEl.getBoundingClientRect(),
          childEl.getBoundingClientRect(),
          canvasRect,
        );
        next.push({
          key: `${rel.fromTable}.${rel.fromColumn}->${rel.toTable}.${rel.toColumn}`,
          d: curvePath(start, end),
          labelX: (start.x + end.x) / 2,
          labelY: (start.y + end.y) / 2 - 12,
          label: "1 : n",
        });
      }

      setArrows(next);
    };

    redraw();
    const ro = new ResizeObserver(() => requestAnimationFrame(redraw));
    ro.observe(canvas);
    for (const name of ordered) {
      const el = entityRefs.current[name];
      if (el) ro.observe(el);
    }
    window.addEventListener("resize", redraw);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", redraw);
    };
  }, [tables, relations, selected, ordered]);

  if (tables.length === 0) return null;

  return (
    <section className="er-diagram" aria-labelledby="er-title">
      <header className="er-head">
        <h2 id="er-title">ER-diagram</h2>
        <p className="muted">
          Visuel model med pile mellem tabeller. Pilen går fra 1-siden (PK) til n-siden (FK).
        </p>
      </header>

      <div className="er-canvas" ref={canvasRef} role="img" aria-label="Entity-relationship diagram">
        <svg className="er-arrows" aria-hidden="true">
          <defs>
            <marker
              id="er-arrowhead"
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
            >
              <path d="M 0 0 L 10 4 L 0 8 Z" fill="#336791" />
            </marker>
            <marker id="er-one" markerWidth="8" markerHeight="12" refX="2" refY="6" orient="auto">
              <path d="M 2 1 L 2 11" stroke="#1f6b4a" strokeWidth="2.2" fill="none" />
            </marker>
          </defs>
          {arrows.map((a) => (
            <g key={a.key}>
              <path
                d={a.d}
                className="er-arrow-path"
                markerStart="url(#er-one)"
                markerEnd="url(#er-arrowhead)"
              />
              <text x={a.labelX} y={a.labelY} className="er-arrow-label" textAnchor="middle">
                {a.label}
              </text>
            </g>
          ))}
        </svg>

        <div className={`er-entities ${ordered.length === 3 ? "er-entities--trio" : ""}`}>
          {ordered.map((name) => {
            const table = byName.get(name)!;
            return (
              <button
                key={name}
                type="button"
                ref={(el) => {
                  entityRefs.current[name] = el;
                }}
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
      </div>

      {relations.length > 0 && (
        <ul className="er-rel-captions">
          {relations.map((r) => (
            <li key={`${r.fromTable}-${r.fromColumn}`}>
              <code>
                {r.toTable}.{r.toColumn}
              </code>
              <span aria-hidden="true"> ← </span>
              <code>
                {r.fromTable}.{r.fromColumn}
              </code>
            </li>
          ))}
        </ul>
      )}

      <p className="er-legend muted">
        Café-modellen: én kunde har mange ordrer, ét produkt indgår i mange ordrer.{" "}
        <code>orders</code> kobler de to.
      </p>
    </section>
  );
}
