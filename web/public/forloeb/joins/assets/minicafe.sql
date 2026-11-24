-- Minicaféen fra SQL-platformens JOIN-diagrammer.
-- Kør filen én gang i en ny PostgreSQL-session. Kør dine SELECT'er i samme session.
-- Tabellerne er midlertidige og forsvinder, når forbindelsen lukkes.
BEGIN;

CREATE TEMPORARY TABLE customers (
    id integer PRIMARY KEY,
    name text NOT NULL,
    city text NOT NULL
);

CREATE TEMPORARY TABLE products (
    id integer PRIMARY KEY,
    name text NOT NULL,
    category text NOT NULL
);

CREATE TEMPORARY TABLE orders (
    id integer PRIMARY KEY,
    customer_id integer REFERENCES customers(id),
    product_id integer NOT NULL REFERENCES products(id),
    quantity integer NOT NULL
);

INSERT INTO customers (id, name, city) VALUES
    (1, 'Anna', 'Viborg'),
    (2, 'Bo', 'Aarhus'),
    (3, 'Clara', 'Viborg');

INSERT INTO products (id, name, category) VALUES
    (1, 'Espresso', 'Drikke'),
    (2, 'Latte', 'Drikke'),
    (3, 'Croissant', 'Bagværk');

INSERT INTO orders (id, customer_id, product_id, quantity) VALUES
    (10, 1,    1, 2),
    (11, 2,    2, 1),
    (12, 1,    2, 1),
    (13, NULL, 1, 1);

COMMIT;
