-- Underviserfacit til SQL-H1-opgaverne, ikke mod labprogrammets midlertidige schemaer.
-- Kør hvert afsnit efter at den tilsvarende seed er indlæst i en separat øvelsesdatabase.

-- security-ex-01
CREATE OR REPLACE VIEW v_public_leaderboard AS
SELECT display_name, wins FROM player_profiles;
REVOKE ALL ON player_profiles FROM PUBLIC;
GRANT SELECT ON v_public_leaderboard TO PUBLIC;

-- testing-ex-01
ALTER TABLE tickets ALTER COLUMN player_id SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN ticket_code SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN quantity SET NOT NULL;
ALTER TABLE tickets ADD CONSTRAINT tickets_player_fk FOREIGN KEY(player_id) REFERENCES players(id);
ALTER TABLE tickets ADD CONSTRAINT tickets_code_unique UNIQUE(ticket_code);
ALTER TABLE tickets ADD CONSTRAINT tickets_quantity_range CHECK(quantity BETWEEN 1 AND 4);
