INSERT INTO customers (name, city, email)
VALUES ('DAL Demo', 'Viborg', 'dal@example.com')
RETURNING id;
INSERT INTO orders(customer_id,product_id,quantity,order_date)
SELECT c.id,p.id,2,DATE '2024-05-01' FROM customers c CROSS JOIN products p WHERE c.name='DAL Demo' AND p.name='Espresso';
