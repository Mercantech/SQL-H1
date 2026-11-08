DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;
CREATE TABLE players (id INTEGER PRIMARY KEY, display_name TEXT NOT NULL);
INSERT INTO players VALUES (1, 'Nova'), (2, 'Pixel');
-- Billetreglerne mangler bevidst. id er alene allerede beskyttet af en PK.
CREATE TABLE tickets (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    player_id INTEGER,
    ticket_code TEXT,
    quantity INTEGER
);
INSERT INTO tickets (player_id, ticket_code, quantity) VALUES (1, 'FINAL-1', 2);
-- En testfixture: faste, ufarlige input afprøver elevens rigtige constraints.
-- Hvert forsøg ligger i en exception-subtransaktion og efterlader ingen rækker.
CREATE FUNCTION gamehub_rejects(test_case TEXT) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE attempt TEXT; expected_state TEXT;
BEGIN
    CASE test_case
    WHEN 'quantity_zero' THEN
        attempt := 'INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(1,''PROBE-ZERO'',0)'; expected_state := '23514';
    WHEN 'quantity_five' THEN
        attempt := 'INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(1,''PROBE-FIVE'',5)'; expected_state := '23514';
    WHEN 'quantity_null' THEN
        attempt := 'INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(1,''PROBE-NULL'',NULL)'; expected_state := '23502';
    WHEN 'player_missing' THEN
        attempt := 'INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(9999,''PROBE-FK'',1)'; expected_state := '23503';
    WHEN 'player_null' THEN
        attempt := 'INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(NULL,''PROBE-PLAYER'',1)'; expected_state := '23502';
    WHEN 'code_duplicate' THEN
        attempt := 'INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(2,''FINAL-1'',1)'; expected_state := '23505';
    WHEN 'code_null' THEN
        attempt := 'INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(1,NULL,1)'; expected_state := '23502';
    ELSE RAISE EXCEPTION 'Ukendt test-case';
    END CASE;
    BEGIN
        EXECUTE attempt;
        RAISE EXCEPTION USING ERRCODE = 'Z0001', MESSAGE = 'Input blev accepteret';
    EXCEPTION WHEN OTHERS THEN
        RETURN SQLSTATE = expected_state;
    END;
END;
$$;
CREATE FUNCTION gamehub_accepts(test_quantity INTEGER) RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        INSERT INTO tickets(player_id,ticket_code,quantity) VALUES(2,'PROBE-VALID-' || test_quantity,test_quantity);
        RAISE EXCEPTION USING ERRCODE = 'Z0001', MESSAGE = 'Gyldigt input accepteret';
    EXCEPTION WHEN SQLSTATE 'Z0001' THEN RETURN TRUE;
    WHEN OTHERS THEN RETURN FALSE;
    END;
END;
$$;
