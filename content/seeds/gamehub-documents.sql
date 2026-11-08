DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO PUBLIC;

CREATE TABLE player_profiles (
  id INTEGER PRIMARY KEY,
  profile JSONB NOT NULL CHECK (jsonb_typeof(profile) = 'object')
);

INSERT INTO player_profiles (id, profile) VALUES
(1, '{"handle":"Nova","region":"EU","rating":1450,"settings":{"theme":"dark"},"games":[{"slug":"rocket","hours":24},{"slug":"valorant","hours":12}]}'),
(2, '{"handle":"Pixel","region":"EU","rating":1280,"settings":{"theme":"light"},"games":[{"slug":"rocket","hours":12},{"slug":"minecraft","hours":18}]}'),
(3, '{"handle":"Rune","region":"EU","rating":990,"settings":{"theme":"dark"},"games":[{"slug":"valorant","hours":20}]}'),
(4, '{"handle":"Echo","region":"NA","rating":1600,"settings":{"theme":"dark"},"games":[]}');
