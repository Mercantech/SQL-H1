CREATE OR REPLACE FUNCTION order_line_total(p_order_id INT)
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT o.quantity * p.price
  FROM orders o
  JOIN products p ON p.id = o.product_id
  WHERE o.id = p_order_id;
$$;
