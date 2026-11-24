ALTER TABLE products ADD CONSTRAINT products_price_positive CHECK (price > 0);
ALTER TABLE customers ADD CONSTRAINT customers_email_unique UNIQUE (email);
