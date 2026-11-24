CREATE OR REPLACE VIEW v_menu AS
SELECT name, category, price FROM products WHERE in_stock = TRUE;
GRANT SELECT ON v_menu TO PUBLIC;
