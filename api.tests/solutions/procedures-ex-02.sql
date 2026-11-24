CREATE OR REPLACE FUNCTION require_positive(p_n INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_n IS NULL OR p_n <= 0 THEN
    RAISE EXCEPTION 'Forventede n > 0, fik %', p_n;
  END IF;
  RETURN p_n;
END;
$$;
