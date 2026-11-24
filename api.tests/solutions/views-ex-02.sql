CREATE OR REPLACE VIEW v_order_lines AS
SELECT
  o.id AS order_id,
  p.category,
  (o.quantity * p.price) AS linje_beloeb
FROM orders o
JOIN products p ON p.id = o.product_id;
CREATE VIEW v_sales_by_category AS SELECT category,SUM(linje_beloeb) AS omsaetning,COUNT(*) AS linjer FROM v_order_lines GROUP BY category;
