import { useEffect, useId, useRef, useState } from "react";
import { MURDER_TABLES, type MurderColumn, type MurderTable } from "../lib/murder/seed";
import { getMurderDdl, MURDER_RELATIONS, type SchemaRelation } from "../lib/murder/schema";
import "./murder-schema.css";

type Props = { open: boolean; onClose: () => void; onInsertSql: (query: string) => void };
type Point = { x: number; y: number };
const WIDTH = 936;
const HEIGHT = 716;
const CARD_WIDTH = 220;
const positions: Record<string, Point> = {
  adgangslog: { x: 28, y: 24 }, afhoeringer: { x: 358, y: 24 }, sessioner: { x: 688, y: 24 },
  adgangskort: { x: 28, y: 230 }, personer: { x: 358, y: 230 }, tilmeldinger: { x: 688, y: 230 },
  transaktioner: { x: 28, y: 500 }, sagsrapporter: { x: 358, y: 500 }, beskeder: { x: 688, y: 500 },
};

function tableHeight(name: string) {
  return 44 + (MURDER_TABLES.find((table) => table.name === name)?.columns.length || 0) * 24;
}

function port(name: string, side: "top" | "bottom" | "left" | "right", column?: string): Point {
  const position = positions[name];
  const index = MURDER_TABLES.find((table) => table.name === name)?.columns.findIndex((entry) => entry.name === column) ?? -1;
  return {
    x: side === "left" ? position.x : side === "right" ? position.x + CARD_WIDTH : position.x + CARD_WIDTH / 2,
    y: side === "top" ? position.y : side === "bottom" ? position.y + tableHeight(name) : column && index >= 0 ? position.y + 52 + index * 24 : position.y + tableHeight(name) / 2,
  };
}

function edgeShape(relation: SchemaRelation) {
  const { fromTable, fromColumn, toTable, toColumn } = relation;
  if (fromTable === "transaktioner" || fromTable === "beskeder") {
    const left = fromTable === "transaktioner";
    const index = fromColumn === "afsender_id" ? 0 : 1;
    const start = { x: positions.personer.x + (left ? 35 + index * 26 : 185 - index * 26), y: positions.personer.y + tableHeight("personer") };
    const end = port(fromTable, left ? "right" : "left", fromColumn);
    const corridor = left ? end.x + 24 + index * 24 : end.x - 24 - index * 24;
    const lane = start.y + 45 + index * 24;
    return { d: `M ${start.x} ${start.y} V ${lane} H ${corridor} V ${end.y} H ${end.x}`, label: { x: (start.x + corridor) / 2, y: lane - 8 } };
  }
  const vertical = fromTable === "adgangslog" || fromTable === "afhoeringer" || toTable === "sessioner";
  const start = port(toTable, vertical ? toTable === "sessioner" ? "bottom" : "top" : fromTable === "adgangskort" ? "left" : "right", toColumn);
  const end = port(fromTable, vertical ? toTable === "sessioner" ? "top" : "bottom" : fromTable === "adgangskort" ? "right" : "left", fromColumn);
  const middle = (start.x + end.x) / 2;
  return {
    d: vertical ? `M ${start.x} ${start.y} L ${end.x} ${end.y}` : `M ${start.x} ${start.y} C ${middle} ${start.y}, ${middle} ${end.y}, ${end.x} ${end.y}`,
    label: { x: vertical ? start.x + 18 : middle, y: vertical ? (start.y + end.y) / 2 : Math.min(start.y, end.y) - 9 },
  };
}

function ColumnKeys({ column }: { column: MurderColumn }) {
  return <span className="murder-schema-column-keys">
    {column.key === "PK" && <abbr className="murder-schema-key is-primary" title="Primærnøgle">PK</abbr>}
    {column.references && <abbr className="murder-schema-key is-foreign" title="Fremmednøgle">FK</abbr>}
  </span>;
}

export function MurderSchema({ open, ...props }: Props) {
  return open ? <SchemaDialog {...props} /> : null;
}

function SchemaDialog({ onClose, onInsertSql }: Omit<Props, "open">) {
  const [view, setView] = useState<"diagram" | "tables">("diagram");
  const [selected, setSelected] = useState("personer");
  const [zoom, setZoom] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const autoFitted = useRef(false);
  const focusEditor = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const detailId = useId();
  const markerId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const table = MURDER_TABLES.find((entry) => entry.name === selected) as MurderTable;
  const relations = MURDER_RELATIONS.filter((relation) => relation.fromTable === selected || relation.toTable === selected);
  const neighbors = new Set(relations.flatMap((relation) => [relation.fromTable, relation.toTable]));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    headingRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      const target = !focusEditor.current && opener instanceof HTMLElement && opener.isConnected
        ? opener : document.querySelector<HTMLElement>(".murder-editor .cm-content");
      target?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const fitInitially = () => {
      if (autoFitted.current || viewport.clientWidth === 0) return;
      autoFitted.current = true;
      if (viewport.clientWidth >= 650) setZoom(Math.min(1, (viewport.clientWidth - 20) / WIDTH, (viewport.clientHeight - 20) / HEIGHT));
    };
    fitInitially();
    const observer = new ResizeObserver(fitInitially);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [view]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const position = positions[selected];
    const left = position.x * zoom + 10;
    const top = position.y * zoom + 10;
    const width = CARD_WIDTH * zoom;
    const height = tableHeight(selected) * zoom;
    const outsideX = left < viewport.scrollLeft || left + width > viewport.scrollLeft + viewport.clientWidth;
    const outsideY = top < viewport.scrollTop || top + height > viewport.scrollTop + viewport.clientHeight;
    if (outsideX || outsideY) viewport.scrollTo({
      left: outsideX ? Math.max(0, left - (viewport.clientWidth - width) / 2) : viewport.scrollLeft,
      top: outsideY ? Math.max(0, top - (viewport.clientHeight - height) / 2) : viewport.scrollTop,
    });
  }, [selected, view, zoom]);

  function fitDiagram() {
    const viewport = viewportRef.current;
    if (!viewport) return;
    setZoom(Math.max(.3, Math.min(1, (viewport.clientWidth - 20) / WIDTH, (viewport.clientHeight - 20) / HEIGHT)));
    viewport.scrollTo({ top: 0, left: 0 });
  }

  function insertSelect() {
    focusEditor.current = true;
    onInsertSql(`SELECT * FROM ${selected}\nLIMIT 10;`);
    onClose();
  }

  return <dialog ref={dialogRef} className="murder-schema-dialog" aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="murder-schema-header">
      <div><span className="murder-eyebrow">SAG 014 / Databaseskema</span><h2 id={titleId} ref={headingRef} tabIndex={-1}>Følg forbindelserne.</h2><p id={descriptionId}>Vælg en tabel for at se kolonner, nøgler og relationer.</p></div>
      <button className="murder-schema-close" type="button" onClick={onClose} aria-label="Luk databaseskema">×</button>
    </header>
    <div className="murder-schema-toolbar">
      <div className="murder-schema-views" role="group" aria-label="Vælg skemavisning"><button type="button" aria-pressed={view === "diagram"} onClick={() => setView("diagram")}>ER-diagram</button><button type="button" aria-pressed={view === "tables"} onClick={() => setView("tables")}>Tabeloversigt</button></div>
      <div className="murder-schema-legend"><span>{MURDER_TABLES.length} tabeller · {MURDER_RELATIONS.length} relationer</span><span><abbr className="murder-schema-key is-primary" title="Primærnøgle">PK</abbr> Primærnøgle</span><span><abbr className="murder-schema-key is-foreign" title="Fremmednøgle">FK</abbr> Fremmednøgle</span></div>
    </div>
    <div className="murder-schema-layout">
      <section className="murder-schema-overview" aria-label={view === "diagram" ? "ER-diagram over mysteriets database" : "Databasens tabeller"}>
        {view === "diagram" ? <>
          <div className="murder-schema-diagram-tools"><span>Zoom, eller rul for at se hele diagrammet.</span><div><button className="murder-tool" type="button" aria-label="Zoom ud i diagram" disabled={zoom <= .35} onClick={() => setZoom((value) => Math.max(.35, value - .15))}>−</button><output aria-label="Diagramzoom">{Math.round(zoom * 100)}%</output><button className="murder-tool" type="button" aria-label="Zoom ind i diagram" disabled={zoom >= 1.5} onClick={() => setZoom((value) => Math.min(1.5, value + .15))}>+</button><button className="murder-tool" type="button" onClick={fitDiagram}>Tilpas</button></div></div>
          <div ref={viewportRef} className="murder-schema-viewport" tabIndex={0} role="region" aria-label="ER-diagram. Rul vandret eller lodret for at se alle tabeller.">
            <div className="murder-schema-size" style={{ width: WIDTH * zoom, height: HEIGHT * zoom }}>
              <div className="murder-schema-board" style={{ width: WIDTH, height: HEIGHT, transform: `scale(${zoom})` }}>
                <svg className="murder-schema-lines" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
                  <defs>
                    <marker id={`${markerId}-one`} markerWidth="12" markerHeight="14" refX="4" refY="7" orient="auto-start-reverse" markerUnits="userSpaceOnUse"><path d="M 4 1 V 13" fill="none" stroke="context-stroke" strokeWidth="1.8" /></marker>
                    <marker id={`${markerId}-many`} markerWidth="14" markerHeight="14" refX="13" refY="7" orient="auto" markerUnits="userSpaceOnUse"><path d="M 1 7 L 13 1 M 1 7 H 13 M 1 7 L 13 13" fill="none" stroke="context-stroke" strokeWidth="1.5" /></marker>
                  </defs>
                  {MURDER_RELATIONS.map((relation) => {
                    const shape = edgeShape(relation);
                    const related = relation.fromTable === selected || relation.toTable === selected;
                    return <g key={relation.id} data-relation={relation.id} className={related ? "is-related" : "is-muted"}>
                      <title>{relation.toTable}.{relation.toColumn} → {relation.fromTable}.{relation.fromColumn} ({relation.cardinality})</title>
                      <path className={`murder-schema-edge ${related ? "is-related" : "is-muted"}`} d={shape.d} markerStart={`url(#${markerId}-one)`} markerEnd={`url(#${markerId}-${relation.cardinality === "1:1" ? "one" : "many"})`} />
                      <text className="murder-schema-edge-label" x={shape.label.x} y={shape.label.y} textAnchor="middle">{relation.cardinality}</text>
                    </g>;
                  })}
                </svg>
                {MURDER_TABLES.map((entry) => <button key={entry.name} type="button" className={`murder-schema-node ${entry.name === selected ? "is-selected" : neighbors.has(entry.name) ? "is-related" : ""}`} style={{ left: positions[entry.name].x, top: positions[entry.name].y, width: CARD_WIDTH, height: tableHeight(entry.name) }} aria-label={`Vis tabel ${entry.name}`} aria-pressed={entry.name === selected} aria-controls={detailId} onClick={() => setSelected(entry.name)}>
                  <span className="murder-schema-node-head"><strong>{entry.name}</strong><small>{entry.columns.length} felter</small></span>
                  <span className="murder-schema-node-columns">{entry.columns.map((column) => <span className="murder-schema-node-column" key={column.name}><ColumnKeys column={column} /><code>{column.name}</code><span className="murder-schema-data-type">{column.type}</span></span>)}</span>
                </button>)}
              </div>
            </div>
          </div>
        </> : <div className="murder-schema-table-grid">{MURDER_TABLES.map((entry) => <button type="button" key={entry.name} className={`murder-schema-table-card ${entry.name === selected ? "is-selected" : ""}`} aria-label={`Vis tabel ${entry.name}`} aria-pressed={entry.name === selected} aria-controls={detailId} onClick={() => setSelected(entry.name)}><strong>{entry.name}</strong><span className="murder-schema-table-description">{entry.description}</span><span>{entry.columns.length} kolonner · {MURDER_RELATIONS.filter((relation) => relation.fromTable === entry.name).length} fremmednøgler</span></button>)}</div>}
      </section>
      <aside id={detailId} className="murder-schema-detail" aria-label="Detaljer om valgt tabel">
        <span className="murder-eyebrow">Valgt tabel</span><h3 aria-live="polite">{table.name}</h3><p>{table.description}</p>
        <table className="murder-schema-columns"><thead><tr><th scope="col">Kolonne</th><th scope="col">Type</th><th scope="col">Nøgle</th></tr></thead><tbody>{table.columns.map((column) => <tr key={column.name}><td><code>{column.name}</code></td><td>{column.type}</td><td><ColumnKeys column={column} /></td></tr>)}</tbody></table>
        {table.columns.filter((column) => column.key === "PK").length > 1 && <p className="murder-schema-composite">Sammensat primærnøgle: <code>({table.columns.filter((column) => column.key === "PK").map((column) => column.name).join(", ")})</code>.</p>}
        <h4>Relationer <span>({relations.length})</span></h4>
        {relations.length > 0 ? <ul className="murder-schema-relations">{relations.map((relation) => <li key={relation.id}><button type="button" onClick={() => setSelected(relation.fromTable === selected ? relation.toTable : relation.fromTable)}><span className="murder-schema-relation-code"><code>{relation.toTable}.{relation.toColumn}</code><span aria-hidden="true">↓</span><code>{relation.fromTable}.{relation.fromColumn}</code></span><span className="murder-schema-relation-type">{relation.cardinality}</span></button></li>)}</ul> : <div className="murder-schema-standalone"><p>Denne tabel står selvstændigt. Sagsrapportens tekst peger på de næste spor; den har ingen fremmednøgler.</p></div>}
        <details className="murder-schema-ddl" key={selected}><summary>Vis CREATE TABLE</summary><pre><code>{getMurderDdl(selected)}</code></pre></details>
        <div className="murder-schema-actions"><button className="murder-run" type="button" onClick={insertSelect}>Indsæt SELECT <span aria-hidden="true">→</span></button></div>
      </aside>
    </div>
    <footer className="murder-schema-footer"><p><strong>1:n</strong> = én til mange · <strong>1:1</strong> = højst én afhøring pr. person. <span>Sagsrapporter står selvstændigt.</span></p><button className="murder-tool" type="button" onClick={onClose}>Tilbage til SQL</button></footer>
  </dialog>;
}
