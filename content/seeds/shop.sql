DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  email TEXT,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  in_stock BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT NOT NULL REFERENCES customers(id),
  product_id INT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  order_date DATE NOT NULL
);

INSERT INTO customers (name, city, email, created_at) VALUES
  ('Anna Jensen', 'Viborg', 'anna@example.com', '2024-01-10'),
  ('Bo Nielsen', 'Aarhus', 'bo@example.com', '2024-02-15'),
  ('Clara Holm', 'Viborg', NULL, '2024-03-01'),
  ('David Lund', 'Aalborg', 'david@example.com', '2024-03-20'),
  ('Eva Mikkelsen', 'Aarhus', 'eva@example.com', '2024-04-01'),
  ('Freja Olsen', 'Viborg', 'freja@example.com', '2024-04-12');

INSERT INTO products (name, category, price, in_stock) VALUES
  ('Espresso', 'Drikke', 28.00, TRUE),
  ('Latte', 'Drikke', 35.00, TRUE),
  ('Croissant', 'Bagværk', 22.50, TRUE),
  ('Sandwich', 'Mad', 48.00, TRUE),
  ('Te', 'Drikke', 25.00, TRUE),
  ('Chokoladebolle', 'Bagværk', 18.00, FALSE),
  ('Smoothie', 'Drikke', 42.00, TRUE),
  ('Saladsandwich', 'Mad', 52.00, TRUE);

INSERT INTO orders (customer_id, product_id, quantity, order_date) VALUES
  (1, 1, 2, '2024-04-01'),
  (1, 3, 1, '2024-04-02'),
  (2, 2, 1, '2024-04-02'),
  (2, 4, 2, '2024-04-03'),
  (3, 5, 3, '2024-04-04'),
  (3, 1, 1, '2024-04-05'),
  (4, 4, 1, '2024-04-05'),
  (4, 2, 2, '2024-04-06'),
  (5, 7, 1, '2024-04-07'),
  (5, 8, 1, '2024-04-08'),
  (6, 3, 2, '2024-04-08'),
  (6, 1, 1, '2024-04-09'),
  (1, 7, 2, '2024-04-10'),
  (2, 5, 1, '2024-04-11');
