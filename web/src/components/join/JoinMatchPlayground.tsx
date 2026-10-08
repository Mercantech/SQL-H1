import { useMemo, useState } from "react";
import { DEMO_CUSTOMERS, DEMO_ORDERS, DEMO_PRODUCTS } from "./joinDemoData";

type Side = "customer" | "order" | null;

type Props = {
  onInsert?: (sql: string) => void;
};

export function JoinMatchPlayground({ onInsert }: Props) {
  const [focus, setFocus] = useState<{ side: Side; id: number } | null>(null);

  const links = useMemo(() => {
    return DEMO_ORDERS.map((o) => ({
      orderId: o.id,
      customerId: o.customer_id,
      productName: DEMO_PRODUCTS.find((p) => p.id === o.product_id)?.name ?? "?",
      quantity: o.quantity,
    }));
  }, []);

  function isCustomerLit(id: number) {
    if (!focus) return false;
    if (focus.side === "customer") return focus.id === id;
    if (focus.side === "order") {
      const o = DEMO_ORDERS.find((x) => x.id === focus.id);
      return o?.customer_id === id;
    }
    return false;
  }

  function isOrderLit(id: number) {
    if (!focus) return false;
    if (focus.side === "order") return focus.id === id;
    if (focus.side === "customer") {
      return DEMO_ORDERS.some((o) => o.id === id && o.customer_id === focus.id);
    }
    return false;
  }

  function isLinkLit(customerId: number, orderId: number) {
    if (!focus) return true;
    if (focus.side === "customer") return customerId === focus.id;
    if (focus.side === "order") return orderId === focus.id;
    return false;
  }

  const unmatchedCustomers = DEMO_CUSTOMERS.filter(
    (c) => !DEMO_ORDERS.some((o) => o.customer_id === c.id),
  );

  return (
    <div className="join-viz" data-widget="match">
      <div className="join-viz-head">
        <strong>Nøgle-match</strong>
        <span className="join-viz-sub">
          Klik en kunde eller ordre — se <code>ON o.customer_id = c.id</code>
        </span>
      </div>

      <div className="join-match-board">
        <div className="join-match-col">
          <h4>customers</h4>
          <ul className="join-match-list">
            {DEMO_CUSTOMERS.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={`join-match-row ${isCustomerLit(c.id) ? "lit" : ""} ${
                    unmatchedCustomers.some((u) => u.id === c.id) ? "orphan" : ""
                  }`}
                  onClick={() =>
                    setFocus((prev) =>
                      prev?.side === "customer" && prev.id === c.id
                        ? null
                        : { side: "customer", id: c.id },
                    )
                  }
                >
                  <span className="join-key">id={c.id}</span>
                  <span>{c.name}</span>
                  <span className="muted">{c.city}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <svg className="join-match-links" viewBox="0 0 80 220" aria-hidden="true">
          {links.map((l, i) => {
            const cIndex = DEMO_CUSTOMERS.findIndex((c) => c.id === l.customerId);
            const oIndex = DEMO_ORDERS.findIndex((o) => o.id === l.orderId);
            const y1 = 28 + cIndex * 52;
            const y2 = 28 + oIndex * 52;
            const lit = isLinkLit(l.customerId, l.orderId);
            return (
              <path
                key={l.orderId}
                d={`M 4 ${y1} C 36 ${y1}, 44 ${y2}, 76 ${y2}`}
                className={`join-link ${lit ? "lit" : "dim"}`}
                style={{ animationDelay: `${i * 40}ms` }}
              />
            );
          })}
        </svg>

        <div className="join-match-col">
          <h4>orders</h4>
          <ul className="join-match-list">
            {DEMO_ORDERS.map((o) => {
              const p = DEMO_PRODUCTS.find((x) => x.id === o.product_id);
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    className={`join-match-row ${isOrderLit(o.id) ? "lit" : ""}`}
                    onClick={() =>
                      setFocus((prev) =>
                        prev?.side === "order" && prev.id === o.id
                          ? null
                          : { side: "order", id: o.id },
                      )
                    }
                  >
                    <span className="join-key">customer_id={o.customer_id}</span>
                    <span>
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
          ingen ordrer — de forsvinder i <strong>INNER JOIN</strong>, men overlever i{" "}
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
