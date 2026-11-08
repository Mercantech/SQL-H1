\pset pager off
\echo 'Reset the two named ranking indexes, preserving seed tables and constraints.'
DROP INDEX IF EXISTS ix_bench_rel_ranking;
DROP INDEX IF EXISTS ix_bench_json_ranking;
ANALYZE bench_players;
ANALYZE bench_profiles;

\echo 'Canonical relational top-20; compare id, handle and rating with JSONB/MongoDB.'
SELECT p.id, p.handle, p.rating
FROM bench_players p JOIN bench_regions r ON r.code = p.region_code
WHERE r.code = 'EU' AND p.rating >= 1200
ORDER BY p.rating DESC, p.id LIMIT 20;

\echo 'Canonical JSONB top-20; identical logical result is required.'
SELECT id, profile ->> 'handle' AS handle, (profile ->> 'rating')::integer AS rating
FROM bench_profiles
WHERE profile ->> 'region' = 'EU' AND (profile ->> 'rating')::integer >= 1200
ORDER BY rating DESC, id LIMIT 20;

\echo 'Warm-up before index (discard these times).'
EXPLAIN (ANALYZE, BUFFERS) SELECT p.id, p.handle, p.rating
FROM bench_players p JOIN bench_regions r ON r.code = p.region_code
WHERE r.code = 'EU' AND p.rating >= 1200 ORDER BY p.rating DESC, p.id LIMIT 20;
EXPLAIN (ANALYZE, BUFFERS) SELECT id, profile ->> 'handle' AS handle, (profile ->> 'rating')::integer AS rating
FROM bench_profiles WHERE profile ->> 'region' = 'EU' AND (profile ->> 'rating')::integer >= 1200
ORDER BY rating DESC, id LIMIT 20;

\echo 'Relational before index: seven recorded plans in order.'
SELECT 'EXPLAIN (ANALYZE, BUFFERS) SELECT p.id,p.handle,p.rating FROM bench_players p JOIN bench_regions r ON r.code=p.region_code WHERE r.code=''EU'' AND p.rating>=1200 ORDER BY p.rating DESC,p.id LIMIT 20;'
FROM generate_series(1, 7) \gexec
\echo 'JSONB before index: seven recorded plans in order.'
SELECT 'EXPLAIN (ANALYZE, BUFFERS) SELECT id,profile->>''handle'' AS handle,(profile->>''rating'')::integer AS rating FROM bench_profiles WHERE profile->>''region''=''EU'' AND (profile->>''rating'')::integer>=1200 ORDER BY rating DESC,id LIMIT 20;'
FROM generate_series(1, 7) \gexec

CREATE INDEX ix_bench_rel_ranking ON bench_players (region_code, rating DESC, id);
CREATE INDEX ix_bench_json_ranking ON bench_profiles ((profile ->> 'region'), ((profile ->> 'rating')::integer) DESC, id);
ANALYZE bench_players;
ANALYZE bench_profiles;

\echo 'Warm-up after index (discard these times).'
EXPLAIN (ANALYZE, BUFFERS) SELECT p.id, p.handle, p.rating
FROM bench_players p JOIN bench_regions r ON r.code = p.region_code
WHERE r.code = 'EU' AND p.rating >= 1200 ORDER BY p.rating DESC, p.id LIMIT 20;
EXPLAIN (ANALYZE, BUFFERS) SELECT id, profile ->> 'handle' AS handle, (profile ->> 'rating')::integer AS rating
FROM bench_profiles WHERE profile ->> 'region' = 'EU' AND (profile ->> 'rating')::integer >= 1200
ORDER BY rating DESC, id LIMIT 20;

\echo 'Relational after index: seven recorded plans in order.'
SELECT 'EXPLAIN (ANALYZE, BUFFERS) SELECT p.id,p.handle,p.rating FROM bench_players p JOIN bench_regions r ON r.code=p.region_code WHERE r.code=''EU'' AND p.rating>=1200 ORDER BY p.rating DESC,p.id LIMIT 20;'
FROM generate_series(1, 7) \gexec
\echo 'JSONB after index: seven recorded plans in order.'
SELECT 'EXPLAIN (ANALYZE, BUFFERS) SELECT id,profile->>''handle'' AS handle,(profile->>''rating'')::integer AS rating FROM bench_profiles WHERE profile->>''region''=''EU'' AND (profile->>''rating'')::integer>=1200 ORDER BY rating DESC,id LIMIT 20;'
FROM generate_series(1, 7) \gexec
