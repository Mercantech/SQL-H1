CREATE TABLE categories (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE);
INSERT INTO categories (name) VALUES ('Drikke'), ('Bagværk'), ('Mad');
ALTER TABLE products ADD COLUMN category_id INT;
ALTER TABLE products ADD CONSTRAINT products_category_fk FOREIGN KEY (category_id) REFERENCES categories(id);
UPDATE products p SET category_id = c.id FROM categories c WHERE c.name = p.category;
