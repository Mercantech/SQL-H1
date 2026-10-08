import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InspectRelation, InspectTable } from "../api";

type Props = {
  tables: InspectTable[];
  relations: InspectRelation[];
  onSelectTable?: (name: string) => void;
  selected?: string | null;
};

type Pos = { x: number; y: number };

type Arrow = {
  key: string;
  d: string;
  labelX: number;
  labelY: number;
  label: string;
};

const POS_KEY = "sqlh1_er_positions";
const CARD_W = 220;
const GRID = 24;

const DEFAULT_LAYOUT: Record<string, Pos> = {
  customers: { x: 40, y: 48 },
  orders: { x: 340, y: 48 },
  products: { x: 640, y: 48 },
};

function snap(n: number) {
  return Math.round(n / GRID) * GRID;
}

function readSavedPositions(): Record<string, Pos> {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Pos>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function initialPositions(tables: InspectTable[]): Record<string, Pos> {
  const saved = readSavedPositions();
  const next: Record<string, Pos> = {};
  let extras = 0;
  for (const t of tables) {
    if (saved[t.name]) {
      next[t.name] = saved[t.name];
    } else if (DEFAULT_LAYOUT[t.name]) {
      next[t.name] = DEFAULT_LAYOUT[t.name];
    } else {
      next[t.name] = {
        x: 40 + (extras % 3) * 300,
        y: 280 + Math.floor(extras / 3) * 220,
      };
      extras += 1;
    }
  }
  return next;
}

function edgePoint(from: DOMRect, to: DOMRect, canvas: DOMRect) {
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

  if (Math.abs(dx) >= Math.abs(dy) * 0.55) {
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

function curvePath(start: { x: number; y: number }, end: { x: number; y: number }) {
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
  const dragRef = useRef<{
    name: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  const [positions, setPositions] = useState<Record<string, Pos>>(() => initialPositions(tables));
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);

  const tableNames = useMemo(() => tables.map((t) => t.name).sort().join("|"), [tables]);

  useEffect(() => {
    setPositions((prev) => {
      const seeded = initialPositions(tables);
      const merged: Record<string, Pos> = {};
      for (const t of tables) {
        merged[t.name] = prev[t.name] ?? seeded[t.name];
      }
      return merged;
    });
  }, [tableNames, tables]);

  useEffect(() => {
    localStorage.setItem(POS_KEY, JSON.stringify(positions));
  }, [positions]);

  const redrawArrows = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
  }, [relations]);

  useEffect(() => {
    redrawArrows();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => requestAnimationFrame(redrawArrows));
    ro.observe(canvas);
    window.addEventListener("resize", redrawArrows);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", redrawArrows);
    };
  }, [redrawArrows, positions, selected, tables]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      const canvas = canvasRef.current;
      if (!drag || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = snap(e.clientX - rect.left - drag.offsetX);
      const y = snap(e.clientY - rect.top - drag.offsetY);
      const maxX = Math.max(0, rect.width - CARD_W);
      const maxY = Math.max(0, canvas.scrollHeight - 80);
      drag.moved = true;
      setPositions((prev) => ({
        ...prev,
        [drag.name]: {
          x: Math.min(maxX, Math.max(0, x)),
          y: Math.min(maxY, Math.max(0, y)),
        },
      }));
    };

    const onUp = () => {
      const drag = dragRef.current;
      if (drag && !drag.moved) onSelectTable?.(drag.name);
      dragRef.current = null;
      setDragging(null);
      if (drag?.moved) requestAnimationFrame(redrawArrows);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [redrawArrows, onSelectTable]);

  function onPointerDown(name: string, e: React.PointerEvent) {
    if (e.button !== 0) return;
    const el = entityRefs.current[name];
    if (!el) return;
    e.preventDefault();
    const elRect = el.getBoundingClientRect();
    dragRef.current = {
      name,
      offsetX: e.clientX - elRect.left,
      offsetY: e.clientY - elRect.top,
      moved: false,
    };
    setDragging(name);
  }

  function resetLayout() {
    localStorage.removeItem(POS_KEY);
    setPositions(initialPositions(tables));
  }

  const canvasHeight = useMemo(() => {
    let max = 420;
    for (const p of Object.values(positions)) {
      max = Math.max(max, p.y + 280);
    }
    return max;
  }, [positions]);

  if (tables.length === 0) return null;

  return (
    <section className="er-diagram" aria-labelledby="er-title">
      <header className="er-head">
        <div>
          <h2 id="er-title">ER-diagram</h2>
          <p className="muted">Træk tabellerne rundt på gitteret. Pilene følger med (1 → n).</p>
        </div>
        <button type="button" className="btn" onClick={resetLayout}>
          Nulstil layout
        </button>
      </header>

      <div
        className={`er-canvas er-canvas--board ${dragging ? "is-dragging" : ""}`}
        ref={canvasRef}
        style={{ height: canvasHeight }}
        role="img"
        aria-label="Trækbart entity-relationship diagram"
      >
        <svg className="er-arrows" aria-hidden="true">
          <defs>
            <pattern id="er-grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
              <path
                d={`M ${GRID} 0 L 0 0 0 ${GRID}`}
                fill="none"
                stroke="rgba(51, 103, 145, 0.12)"
                strokeWidth="1"
              />
            </pattern>
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
          <rect width="100%" height="100%" fill="url(#er-grid)" />
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

        {tables.map((table) => {
          const pos = positions[table.name] ?? { x: 40, y: 40 };
          return (
            <button
              key={table.name}
              type="button"
              ref={(el) => {
                entityRefs.current[table.name] = el;
              }}
              className={`er-entity er-entity--abs ${selected === table.name ? "active" : ""} ${
                dragging === table.name ? "dragging" : ""
              }`}
              style={{
                width: CARD_W,
                transform: `translate(${pos.x}px, ${pos.y}px)`,
              }}
              onPointerDown={(e) => onPointerDown(table.name, e)}
            >
              <div className="er-entity-head er-entity-drag">
                <span className="er-entity-name">{table.name}</span>
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
        Tip: træk i tabelhovedet. Positionerne huskes i browseren.{" "}
        <code>orders</code> kobler kunder og produkter (1:n / n:1).
      </p>
    </section>
  );
}
