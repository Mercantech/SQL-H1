CREATE TABLE suppliers (id SERIAL PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL);
ALTER TABLE products ADD COLUMN supplier_id INT;
ALTER TABLE products ADD CONSTRAINT products_supplier_fk FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
CREATE INDEX ix_products_supplier ON products(supplier_id);
INSERT INTO suppliers (name, city) VALUES ('Nordic Beans', 'Aarhus');
UPDATE products SET supplier_id = (SELECT id FROM suppliers WHERE name = 'Nordic Beans') WHERE name = 'Espresso';
