import { useMemo, useState } from "react";
import { DEMO_CUSTOMERS, DEMO_ORDERS, DEMO_PRODUCTS } from "./joinDemoData";

type Props = {
  onInsert?: (sql: string) => void;
};

type Hop = "customers" | "orders" | "products";

export function JoinChainViz({ onInsert }: Props) {
  const [orderId, setOrderId] = useState(DEMO_ORDERS[0]?.id ?? 10);
  const [pulse, setPulse] = useState<Hop | null>(null);

  const path = useMemo(() => {
    const order = DEMO_ORDERS.find((o) => o.id === orderId) ?? DEMO_ORDERS[0];
    const customer = DEMO_CUSTOMERS.find((c) => c.id === order.customer_id);
    const product = DEMO_PRODUCTS.find((p) => p.id === order.product_id);
    return { order, customer, product };
  }, [orderId]);

  function flash(hop: Hop) {
    setPulse(hop);
    window.setTimeout(() => setPulse(null), 450);
  }

  return (
    <div className="join-viz" data-widget="chain">
      <div className="join-viz-head">
        <strong>Trekæde: kunde → ordre → produkt</strong>
        <span className="join-viz-sub">Vælg en ordre og følg nøglerne gennem tabellerne</span>
      </div>

      <div className="join-chain-picker" role="group" aria-label="Vælg ordre">
        {DEMO_ORDERS.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`join-chain-pill ${orderId === o.id ? "active" : ""}`}
            onClick={() => {
              setOrderId(o.id);
              flash("orders");
            }}
          >
            Ordre #{o.id}
          </button>
        ))}
      </div>

      <div className="join-chain">
        <button
          type="button"
          className={`join-chain-node ${pulse === "customers" ? "pulse" : ""}`}
          onClick={() => flash("customers")}
        >
          <span className="join-chain-table">customers</span>
          <strong>{path.customer?.name}</strong>
          <span className="join-key">id = {path.customer?.id}</span>
          <span className="muted">{path.customer?.city}</span>
        </button>

        <div className="join-chain-edge" aria-hidden="true">
          <span className="join-chain-on">ON o.customer_id = c.id</span>
          <span className="join-chain-arrow" />
        </div>

        <button
          type="button"
          className={`join-chain-node ${pulse === "orders" ? "pulse" : ""}`}
          onClick={() => flash("orders")}
        >
          <span className="join-chain-table">orders</span>
          <strong>#{path.order.id}</strong>
          <span className="join-key">customer_id = {path.order.customer_id}</span>
          <span className="join-key">product_id = {path.order.product_id}</span>
          <span className="muted">antal {path.order.quantity}</span>
        </button>

        <div className="join-chain-edge" aria-hidden="true">
          <span className="join-chain-on">ON p.id = o.product_id</span>
          <span className="join-chain-arrow" />
        </div>

        <button
          type="button"
          className={`join-chain-node ${pulse === "products" ? "pulse" : ""}`}
          onClick={() => flash("products")}
        >
          <span className="join-chain-table">products</span>
          <strong>{path.product?.name}</strong>
          <span className="join-key">id = {path.product?.id}</span>
          <span className="muted">{path.product?.category}</span>
        </button>
      </div>

      <p className="join-viz-note">
        Resultatrækken bliver: <strong>{path.customer?.name}</strong> købte{" "}
        <strong>{path.product?.name}</strong> (×{path.order.quantity}).
      </p>

      {onInsert && (
        <div className="join-viz-actions">
          <button
            type="button"
            className="btn"
            onClick={() =>
              onInsert(`SELECT c.name AS kunde, p.name AS produkt, o.quantity
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id
ORDER BY o.id;`)
            }
          >
            Indsæt tre-tabel JOIN
          </button>
        </div>
      )}
    </div>
  );
}
