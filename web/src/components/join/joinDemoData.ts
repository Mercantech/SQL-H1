/** Mini-café-data til JOIN-visualiseringer (bevidst med huller på begge sider). */

export type DemoCustomer = { id: number; name: string; city: string };
export type DemoProduct = { id: number; name: string; category: string };
export type DemoOrder = {
  id: number;
  customer_id: number | null;
  product_id: number;
  quantity: number;
};

export const DEMO_CUSTOMERS: DemoCustomer[] = [
  { id: 1, name: "Anna", city: "Viborg" },
  { id: 2, name: "Bo", city: "Aarhus" },
  { id: 3, name: "Clara", city: "Viborg" },
];

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 1, name: "Espresso", category: "Drikke" },
  { id: 2, name: "Latte", category: "Drikke" },
  { id: 3, name: "Croissant", category: "Bagværk" },
];

/**
 * Clara (3) har ingen ordrer (kun venstre).
 * Ordre #13 er walk-in med customer_id NULL (kun højre).
 * Croissant (3) har ingen ordrer (produktsiden i LEFT JOIN-demo).
 */
export const DEMO_ORDERS: DemoOrder[] = [
  { id: 10, customer_id: 1, product_id: 1, quantity: 2 },
  { id: 11, customer_id: 2, product_id: 2, quantity: 1 },
  { id: 12, customer_id: 1, product_id: 2, quantity: 1 },
  { id: 13, customer_id: null, product_id: 1, quantity: 1 },
];

export type JoinKind = "inner" | "left" | "right" | "full";

export type JoinResultRow = {
  leftLabel: string;
  rightLabel: string;
  matched: boolean;
  fromLeft: boolean;
  fromRight: boolean;
};

/** customers ⨝ orders på customer_id (NULL matcher aldrig). */
export function joinCustomersOrders(kind: JoinKind): JoinResultRow[] {
  const rows: JoinResultRow[] = [];
  const usedOrders = new Set<number>();

  for (const c of DEMO_CUSTOMERS) {
    const matches = DEMO_ORDERS.filter((o) => o.customer_id === c.id);
    if (matches.length === 0) {
      if (kind === "left" || kind === "full") {
        rows.push({
          leftLabel: c.name,
          rightLabel: "NULL",
          matched: false,
          fromLeft: true,
          fromRight: false,
        });
      }
      continue;
    }
    for (const o of matches) {
      usedOrders.add(o.id);
      const p = DEMO_PRODUCTS.find((x) => x.id === o.product_id);
      rows.push({
        leftLabel: c.name,
        rightLabel: `ordre #${o.id} (${p?.name ?? "?"})`,
        matched: true,
        fromLeft: true,
        fromRight: true,
      });
    }
  }

  if (kind === "right" || kind === "full") {
    for (const o of DEMO_ORDERS) {
      if (usedOrders.has(o.id)) continue;
      const hasCustomer = o.customer_id != null && DEMO_CUSTOMERS.some((c) => c.id === o.customer_id);
      if (hasCustomer) continue;
      const p = DEMO_PRODUCTS.find((x) => x.id === o.product_id);
      rows.push({
        leftLabel: "NULL",
        rightLabel: `ordre #${o.id} (${p?.name ?? "?"})`,
        matched: false,
        fromLeft: false,
        fromRight: true,
      });
    }
  }

  if (kind === "inner") {
    return rows.filter((r) => r.matched);
  }
  return rows;
}

export type ProductOrderRow = {
  product: string;
  orderLabel: string;
  matched: boolean;
};

export function leftJoinProductsOrders(): ProductOrderRow[] {
  return DEMO_PRODUCTS.map((p) => {
    const orders = DEMO_ORDERS.filter((o) => o.product_id === p.id);
    if (orders.length === 0) {
      return { product: p.name, orderLabel: "NULL", matched: false };
    }
    return {
      product: p.name,
      orderLabel: orders.map((o) => `#${o.id}`).join(", "),
      matched: true,
    };
  });
}
