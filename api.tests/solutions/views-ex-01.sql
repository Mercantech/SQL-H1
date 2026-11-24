CREATE OR REPLACE VIEW v_order_lines AS
SELECT
  o.id AS order_id,
  COALESCE(c.name, 'Walk-in') AS kunde,
  p.name AS produkt,
  o.quantity,
  (o.quantity * p.price) AS linje_beloeb,
  o.order_date
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
JOIN products p ON p.id = o.product_id;
