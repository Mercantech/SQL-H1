ALTER TABLE tickets ALTER COLUMN player_id SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN ticket_code SET NOT NULL;
ALTER TABLE tickets ALTER COLUMN quantity SET NOT NULL;
ALTER TABLE tickets ADD CONSTRAINT tickets_player_fk FOREIGN KEY(player_id) REFERENCES players(id);
ALTER TABLE tickets ADD CONSTRAINT tickets_code_unique UNIQUE(ticket_code);
ALTER TABLE tickets ADD CONSTRAINT tickets_quantity_range CHECK(quantity BETWEEN 1 AND 4);
