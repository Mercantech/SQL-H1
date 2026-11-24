ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
CREATE FUNCTION touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at:=now(); RETURN NEW; END $$;
CREATE TRIGGER trg_products_touch BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
UPDATE products SET name=name WHERE name='Te';
