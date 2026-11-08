-- Run ONLY against the disposable gamehub lab. Named benchmark tables only.
DROP TABLE IF EXISTS bench_players;
DROP TABLE IF EXISTS bench_regions;
DROP TABLE IF EXISTS bench_profiles;

CREATE TABLE bench_regions (
  code TEXT PRIMARY KEY
);
INSERT INTO bench_regions VALUES ('EU'), ('NA');

CREATE TABLE bench_players (
  id INTEGER PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  region_code TEXT NOT NULL REFERENCES bench_regions(code),
  rating INTEGER NOT NULL CHECK (rating >= 0)
);

CREATE TABLE bench_profiles (
  id INTEGER PRIMARY KEY,
  profile JSONB NOT NULL CHECK (jsonb_typeof(profile) = 'object')
);

INSERT INTO bench_players (id, handle, region_code, rating)
SELECT i, 'Player' || lpad(i::text, 5, '0'),
       CASE WHEN i % 3 = 0 THEN 'NA' ELSE 'EU' END,
       (i * 37) % 2000
FROM generate_series(1, 10000) AS source(i);

INSERT INTO bench_profiles (id, profile)
SELECT id, jsonb_build_object('handle', handle, 'region', region_code, 'rating', rating)
FROM bench_players;

ANALYZE bench_players;
ANALYZE bench_regions;
ANALYZE bench_profiles;

-- Both representations must produce 10000, 50005000, 9995000.
SELECT 'relational' AS representation, count(*), sum(id), sum(rating) FROM bench_players
UNION ALL
SELECT 'jsonb', count(*), sum(id), sum((profile ->> 'rating')::integer) FROM bench_profiles;
