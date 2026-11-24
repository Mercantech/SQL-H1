DELETE FROM orders WHERE product_id = (SELECT id FROM products WHERE name = 'Latte');
DELETE FROM products WHERE name = 'Latte';
DELETE FROM orders WHERE order_date = DATE '2024-04-01';
