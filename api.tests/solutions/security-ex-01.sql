CREATE OR REPLACE VIEW v_public_leaderboard AS
SELECT display_name, wins FROM player_profiles;
REVOKE ALL ON player_profiles FROM PUBLIC;
GRANT SELECT ON v_public_leaderboard TO PUBLIC;
