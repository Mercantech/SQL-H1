INSERT INTO customers (name, city, email) VALUES ('Gina Berg', 'Randers', 'gina@example.com') RETURNING id, name;
UPDATE products SET price = 45.00 WHERE name = 'Smoothie' RETURNING name, price;
