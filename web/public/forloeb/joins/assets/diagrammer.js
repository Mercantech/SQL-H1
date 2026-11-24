(() => {
  "use strict";

  // Samme miniaturecafé som i SQL-modulets joinDemoData.ts.
  const customers = [
    { id: 1, name: "Anna" },
    { id: 2, name: "Bo" },
    { id: 3, name: "Clara" },
  ];
  const orders = [
    { id: 10, customerId: 1, productId: 1, quantity: 2 },
    { id: 11, customerId: 2, productId: 2, quantity: 1 },
    { id: 12, customerId: 1, productId: 2, quantity: 1 },
    { id: 13, customerId: null, productId: 1, quantity: 1 },
  ];
  const products = [
    { id: 1, name: "Espresso" },
    { id: 2, name: "Latte" },
    { id: 3, name: "Croissant" },
  ];
  const joins = {
    inner: "Anna har to ordrer, og Bo har én. Clara og ordre 13 mangler en makker.",
    left: "Clara får en række med NULL i ordre. Ordre 13 falder ud, fordi den mangler en kunde.",
    right: "Ordre 13 får en række med NULL i kunde. Clara falder ud, fordi hun mangler en ordre.",
    full: "Både Clara og ordre 13 får en række. De to rækker har NULL i hver sin kolonne.",
  };

  function sourceTable(name, columns, rows) {
    const headings = columns.map((label) => `<th scope="col">${label}</th>`).join("");
    const body = rows.map(({ key, cells }) => `<tr data-key="${key}">
      <td>${cells[0]}</td><td>${cells[1]}</td></tr>`).join("");
    return `<table class="jm-source jm-${name}">
      <caption>${name}</caption><thead><tr>${headings}</tr></thead>
      <tbody>${body}</tbody></table>`;
  }

  function resultRows(kind) {
    const rows = [];
    for (const customer of customers) {
      const matches = orders.filter((order) => order.customerId === customer.id);
      matches.forEach((order) => rows.push([customer, order]));
      if (!matches.length && (kind === "left" || kind === "full")) {
        rows.push([customer, null]);
      }
    }
    if (kind === "right" || kind === "full") {
      orders.filter((order) => !customers.some((customer) => customer.id === order.customerId))
        .forEach((order) => rows.push([null, order]));
    }
    return rows;
  }

  function matchingLines() {
    // Tabellen bruger lige høje rækker. SVG'en skalerer uafhængigt i de to retninger.
    const paths = orders.map((order, orderIndex) => {
      const customerIndex = customers.findIndex((customer) => customer.id === order.customerId);
      if (customerIndex === -1) return "";
      const start = customerIndex * 40 + 20;
      const end = orderIndex * 40 + 20;
      return `<path class="jm-wire" d="M 0 ${start} C 47 ${start}, 53 ${end}, 100 ${end}" />`;
    }).join("");
    return `<div class="jm-lines" aria-hidden="true">
      <svg viewBox="0 0 100 160" preserveAspectRatio="none" focusable="false">
        ${paths}
      </svg></div>`;
  }

  const nullValue = '<span class="jm-null">NULL</span>';

  function mountMap(container, instance) {
    const start = Object.hasOwn(joins, container.dataset.start) ? container.dataset.start : "inner";
    const customerTable = sourceTable("customers", ["name", "id"],
      customers.map((customer) => ({ key: customer.id, cells: [customer.name, customer.id] })));
    const orderTable = sourceTable("orders", ["customer_id", "id"],
      orders.map((order) => ({ key: order.id, cells: [order.customerId ?? nullValue, order.id] })));
    const choices = Object.keys(joins).map((kind) => `<label>
      <input type="radio" name="join-kind-${instance}" value="${kind}" ${kind === start ? "checked" : ""}>
      <span>${kind.toUpperCase()}</span></label>`).join("");

    container.classList.add("join-figure");
    container.innerHTML = `
      <fieldset class="jm-choices"><legend>Vælg JOIN-type</legend><div>${choices}</div></fieldset>
      <div class="jm-data-map">${customerTable}${matchingLines()}${orderTable}</div>
      <p class="jm-legend"><span><i class="jm-match-key" aria-hidden="true"></i>Match på id</span>
        <span><i class="jm-keep-key" aria-hidden="true"></i>Med uden match</span>
        <span><i class="jm-skip-key" aria-hidden="true"></i>Udeladt</span></p>
      <div class="jm-output"><div class="jm-query">
        <pre><code>SELECT c.name AS kunde, o.id AS ordre
FROM customers c
<strong data-sql-kind></strong> JOIN orders o
  ON c.id = o.customer_id
ORDER BY c.id NULLS LAST, o.id;</code></pre>
        <p class="jm-explanation"></p></div>
        <table class="jm-result"><caption><span data-count aria-live="polite" aria-atomic="true"></span></caption>
        <thead><tr><th scope="col">kunde</th><th scope="col">ordre</th></tr></thead><tbody></tbody></table></div>`;

    function render(kind) {
      const rows = resultRows(kind);
      const sources = [
        [".jm-customers tr[data-key]", 0],
        [".jm-orders tr[data-key]", 1],
      ];
      for (const [selector, side] of sources) {
        for (const tr of container.querySelectorAll(selector)) {
          const id = Number(tr.dataset.key);
          const pair = rows.find((row) => row[side]?.id === id);
          tr.dataset.state = !pair ? "excluded" : pair[1 - side] ? "matched" : "retained";
        }
      }
      container.querySelector("[data-sql-kind]").textContent = kind.toUpperCase();
      container.querySelector("[data-count]").textContent = `${kind.toUpperCase()} giver ${rows.length} rækker`;
      container.querySelector(".jm-explanation").textContent = joins[kind];
      container.querySelector(".jm-result tbody").innerHTML = rows.map(([customer, order]) =>
        `<tr data-state="${customer && order ? "matched" : "retained"}"><td>${customer?.name ?? nullValue}</td><td>${order?.id ?? nullValue}</td></tr>`
      ).join("");
    }
    container.querySelector(".jm-choices").addEventListener("change", (event) => render(event.target.value));
    render(start);
  }

  function mountTrace(container) {
    const order = orders.find((item) => item.id === 10);
    const customer = customers.find((item) => item.id === order.customerId);
    const product = products.find((item) => item.id === order.productId);
    const lookup = (name, item) => `<div class="jt-record">
      <strong class="jt-table-name">${name}</strong>
      <dl><div><dt>id</dt><dd>${item.id}</dd></div><div><dt>name</dt><dd>${item.name}</dd></div></dl></div>`;
    container.classList.add("join-figure", "jt-figure");
    container.innerHTML = `<div class="jt-flow">
      <div class="jt-order-cap"><strong class="jt-table-name">orders</strong><span>id = ${order.id}</span></div>
      <div class="jt-fk jt-customer"><span>customer_id</span><b>${order.customerId}</b></div>
      <div class="jt-arrow jt-customer" aria-hidden="true"></div>
      <div class="jt-lookup jt-customer">${lookup("customers", customer)}</div>
      <div class="jt-fk jt-product"><span>product_id</span><b>${order.productId}</b></div>
      <div class="jt-arrow jt-product" aria-hidden="true"></div>
      <div class="jt-lookup jt-product">${lookup("products", product)}</div>
      <div class="jt-quantity"><span>quantity</span><b>${order.quantity}</b></div>
      </div><p class="jt-receipt"><span>Ordre ${order.id}</span>
        <strong>${customer.name} bestilte ${order.quantity} × ${product.name}.</strong></p>`;
  }

  document.querySelectorAll("[data-join-map]").forEach(mountMap);
  document.querySelectorAll("[data-join-trace]").forEach(mountTrace);
})();
