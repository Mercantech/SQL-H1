DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  order_date DATE NOT NULL
);

INSERT INTO customers (name, city, created_at) VALUES
  ('Anna Jensen', 'Viborg', '2024-01-10'),
  ('Bo Nielsen', 'Aarhus', '2024-02-15'),
  ('Clara Holm', 'Viborg', '2024-03-01'),
  ('David Lund', 'Aalborg', '2024-03-20');

INSERT INTO products (name, category, price) VALUES
  ('Espresso', 'Drikke', 28.00),
  ('Latte', 'Drikke', 35.00),
  ('Croissant', 'Bagværk', 22.50),
  ('Sandwich', 'Mad', 48.00),
  ('Te', 'Drikke', 25.00);

INSERT INTO orders (customer_id, product_id, quantity, order_date) VALUES
  (1, 1, 2, '2024-04-01'),
  (1, 3, 1, '2024-04-02'),
  (2, 2, 1, '2024-04-02'),
  (2, 4, 2, '2024-04-03'),
  (3, 5, 3, '2024-04-04'),
  (3, 1, 1, '2024-04-05'),
  (4, 4, 1, '2024-04-05'),
  (4, 2, 2, '2024-04-06');
