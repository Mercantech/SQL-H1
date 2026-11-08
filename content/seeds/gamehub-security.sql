DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;
CREATE TABLE player_profiles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    display_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    auth_sub UUID NOT NULL UNIQUE,
    wins INTEGER NOT NULL CHECK (wins >= 0)
);
INSERT INTO player_profiles (display_name, email, auth_sub, wins) VALUES
('Nova', 'nova@example.invalid', '10000000-0000-0000-0000-000000000001', 7),
('Pixel', 'pixel@example.invalid', '10000000-0000-0000-0000-000000000002', 4),
('Snabel', 'snabel@example.invalid', '10000000-0000-0000-0000-000000000003', 9);
-- Bevidst fejlkonfiguration i en isoleret øvelse. Eleven skal fjerne den.
GRANT SELECT ON player_profiles TO PUBLIC;
