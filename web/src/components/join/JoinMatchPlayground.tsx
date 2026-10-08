import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DEMO_CUSTOMERS, DEMO_ORDERS, DEMO_PRODUCTS } from "./joinDemoData";

type Side = "customer" | "order";

type Focus = { side: Side; id: number };

type LinkGeom = {
  orderId: number;
  customerId: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type Props = {
  onInsert?: (sql: string) => void;
};

export function JoinMatchPlayground({ onInsert }: Props) {
  const [focus, setFocus] = useState<Focus | null>({ side: "customer", id: 1 });
  const boardRef = useRef<HTMLDivElement>(null);
  const customerRefs = useRef(new Map<number, HTMLButtonElement>());
  const orderRefs = useRef(new Map<number, HTMLButtonElement>());
  const [links, setLinks] = useState<LinkGeom[]>([]);
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });

  const unmatchedCustomers = useMemo(
    () => DEMO_CUSTOMERS.filter((c) => !DEMO_ORDERS.some((o) => o.customer_id === c.id)),
    [],
  );

  function measure() {
    const board = boardRef.current;
    if (!board) return;
    const br = board.getBoundingClientRect();
    setBoardSize({ w: br.width, h: br.height });

    const next: LinkGeom[] = [];
    for (const o of DEMO_ORDERS) {
      const cEl = customerRefs.current.get(o.customer_id);
      const oEl = orderRefs.current.get(o.id);
      if (!cEl || !oEl) continue;
      const cr = cEl.getBoundingClientRect();
      const or = oEl.getBoundingClientRect();
      next.push({
        orderId: o.id,
        customerId: o.customer_id,
        x1: cr.right - br.left,
        y1: cr.top + cr.height / 2 - br.top,
        x2: or.left - br.left,
        y2: or.top + or.height / 2 - br.top,
      });
    }
    setLinks(next);
  }

  useLayoutEffect(() => {
    measure();
  }, [focus]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(board);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  function relatedCustomer(id: number) {
    if (!focus) return true;
    if (focus.side === "customer") return focus.id === id;
    const o = DEMO_ORDERS.find((x) => x.id === focus.id);
    return o?.customer_id === id;
  }

  function relatedOrder(id: number) {
    if (!focus) return true;
    if (focus.side === "order") return focus.id === id;
    return DEMO_ORDERS.some((o) => o.id === id && o.customer_id === focus.id);
  }

  function relatedLink(customerId: number, orderId: number) {
    if (!focus) return true;
    if (focus.side === "customer") return customerId === focus.id;
    return orderId === focus.id;
  }

  const activeKey =
    focus?.side === "customer"
      ? focus.id
      : focus
        ? DEMO_ORDERS.find((o) => o.id === focus.id)?.customer_id
        : null;

  const matchCount =
    activeKey == null ? 0 : DEMO_ORDERS.filter((o) => o.customer_id === activeKey).length;

  function toggle(next: Focus) {
    setFocus((prev) => (prev?.side === next.side && prev.id === next.id ? null : next));
  }

  return (
    <div className="join-viz" data-widget="match">
      <div className="join-viz-head">
        <strong>Nøgle-match</strong>
        <span className="join-viz-sub">
          Klik en kunde eller ordre — se <code>ON o.customer_id = c.id</code>
        </span>
      </div>

      {activeKey != null && (
        <div className="join-match-eq" aria-live="polite">
          <span className="join-match-eq-side">c.id</span>
          <span className="join-match-eq-val">{activeKey}</span>
          <span className="join-match-eq-op">=</span>
          <span className="join-match-eq-val">{activeKey}</span>
          <span className="join-match-eq-side">o.customer_id</span>
          <span className="join-match-eq-count">
            {matchCount === 0
              ? "ingen match"
              : matchCount === 1
                ? "1 match"
                : `${matchCount} matches (1:n)`}
          </span>
        </div>
      )}

      <div className="join-match-board" ref={boardRef}>
        <div className="join-match-col">
          <h4>customers</h4>
          <ul className="join-match-list">
            {DEMO_CUSTOMERS.map((c) => {
              const lit = relatedCustomer(c.id);
              const orphan = unmatchedCustomers.some((u) => u.id === c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) customerRefs.current.set(c.id, el);
                      else customerRefs.current.delete(c.id);
                    }}
                    className={`join-match-row ${lit && focus ? "lit" : ""} ${
                      focus && !lit ? "dim" : ""
                    } ${orphan ? "orphan" : ""}`}
                    onClick={() => toggle({ side: "customer", id: c.id })}
                  >
                    <span className="join-key">id = {c.id}</span>
                    <span className="join-match-name">{c.name}</span>
                    <span className="muted">{c.city}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <svg
          className="join-match-links-overlay"
          width={boardSize.w || "100%"}
          height={boardSize.h || "100%"}
          aria-hidden="true"
        >
          {links.map((l) => {
            const lit = relatedLink(l.customerId, l.orderId);
            const midX = (l.x1 + l.x2) / 2;
            const d = `M ${l.x1} ${l.y1} C ${midX} ${l.y1}, ${midX} ${l.y2}, ${l.x2} ${l.y2}`;
            return (
              <g key={l.orderId} className={`join-link-g ${focus ? (lit ? "lit" : "dim") : "idle"}`}>
                <path d={d} className="join-link-hit" />
                <path d={d} className="join-link" />
                <circle cx={l.x1} cy={l.y1} r="3.5" className="join-link-dot" />
                <circle cx={l.x2} cy={l.y2} r="3.5" className="join-link-dot" />
              </g>
            );
          })}
        </svg>

        <div className="join-match-col join-match-col-right">
          <h4>orders</h4>
          <ul className="join-match-list">
            {DEMO_ORDERS.map((o) => {
              const p = DEMO_PRODUCTS.find((x) => x.id === o.product_id);
              const lit = relatedOrder(o.id);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    ref={(el) => {
                      if (el) orderRefs.current.set(o.id, el);
                      else orderRefs.current.delete(o.id);
                    }}
                    className={`join-match-row ${lit && focus ? "lit" : ""} ${
                      focus && !lit ? "dim" : ""
                    }`}
                    onClick={() => toggle({ side: "order", id: o.id })}
                  >
                    <span className="join-key">customer_id = {o.customer_id}</span>
                    <span className="join-match-name">
                      #{o.id} · {p?.name}
                    </span>
                    <span className="muted">×{o.quantity}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {unmatchedCustomers.length > 0 && (
        <p className="join-viz-note">
          <span className="join-orphan-dot" /> {unmatchedCustomers.map((c) => c.name).join(", ")} har
          ingen ordrer — forsvinder i <strong>INNER JOIN</strong>, overlever i{" "}
          <strong>LEFT JOIN</strong>.
        </p>
      )}

      {onInsert && (
        <div className="join-viz-actions">
          <button
            type="button"
            className="btn"
            onClick={() =>
              onInsert(`SELECT c.name, o.id AS ordre_id, o.quantity
FROM customers c
JOIN orders o ON o.customer_id = c.id
ORDER BY c.name, o.id;`)
            }
          >
            Indsæt SQL i editor
          </button>
        </div>
      )}
    </div>
  );
}
