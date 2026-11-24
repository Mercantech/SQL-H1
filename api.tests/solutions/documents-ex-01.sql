CREATE VIEW v_ranked_players AS SELECT profile->>'handle' AS handle,(profile->>'rating')::integer AS rating FROM player_profiles WHERE profile->>'region'='EU' AND (profile->>'rating')::integer>=1200;
CREATE VIEW v_game_hours AS SELECT g->>'slug' AS game,SUM((g->>'hours')::integer) AS hours FROM player_profiles CROSS JOIN LATERAL jsonb_array_elements(profile->'games') g GROUP BY g->>'slug';
UPDATE player_profiles SET profile=jsonb_set(profile,'{settings,theme}','"high-contrast"') WHERE id=1;
CREATE INDEX ix_player_profiles_profile ON player_profiles USING gin(profile);
