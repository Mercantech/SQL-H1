CREATE TABLE IF NOT EXISTS product_audit (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  old_price NUMERIC(10,2),
  new_price NUMERIC(10,2),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE FUNCTION log_product_price_change() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
IF OLD.price IS DISTINCT FROM NEW.price THEN INSERT INTO product_audit(product_id,old_price,new_price) VALUES (NEW.id,OLD.price,NEW.price); END IF; RETURN NEW; END $$;
CREATE TRIGGER trg_product_price AFTER UPDATE ON products FOR EACH ROW EXECUTE FUNCTION log_product_price_change();
UPDATE products SET price=30 WHERE name='Espresso';
