INSERT INTO products (name, category, price, in_stock) VALUES ('Kakao', 'Drikke', 32.00, TRUE);
INSERT INTO customers (name, city, email) VALUES ('Ida Ravn', 'Odense', 'ida@example.com');
UPDATE products SET price = price + 1.50 WHERE category = 'Bagværk';
