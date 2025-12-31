


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."calculate_attendance_rate"("player_id_param" "uuid", "team_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("total_sessions" integer, "attended_sessions" integer, "attendance_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  total INT;
  attended INT;
  rate NUMERIC;
BEGIN
  -- Count total sessions for this player (in team if specified)
  SELECT COUNT(DISTINCT sa.session_id) INTO total
  FROM session_attendance sa
  JOIN sessions s ON sa.session_id = s.id
  WHERE sa.player_id = player_id_param
    AND (team_id_param IS NULL OR s.team_id = team_id_param);
  
  -- Count attended sessions
  SELECT COUNT(*) INTO attended
  FROM session_attendance sa
  JOIN sessions s ON sa.session_id = s.id
  WHERE sa.player_id = player_id_param
    AND sa.is_present = true
    AND (team_id_param IS NULL OR s.team_id = team_id_param);
  
  -- Calculate rate
  IF total > 0 THEN
    rate := ROUND((attended::NUMERIC / total::NUMERIC) * 100, 1);
  ELSE
    rate := 0;
  END IF;
  
  RETURN QUERY SELECT total, attended, rate;
END;
$$;


ALTER FUNCTION "public"."calculate_attendance_rate"("player_id_param" "uuid", "team_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_attendance_rate"("player_id_param" "uuid", "team_id_param" "uuid") IS 'Calculates attendance rate for a player, optionally filtered by team';



CREATE OR REPLACE FUNCTION "public"."check_player_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_tier TEXT;
  user_status TEXT;
  player_count INTEGER;
  max_players INTEGER;
BEGIN
  -- Get user's subscription tier and status via team (using user_id)
  SELECT u.subscription_tier, u.subscription_status INTO user_tier, user_status
  FROM users u
  JOIN teams t ON t.user_id = u.id
  WHERE t.id = NEW.team_id;
  
  -- Rest of the function remains the same
  IF user_status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Your subscription is not active.';
  END IF;
  
  SELECT (get_tier_limits(user_tier)).max_players_per_team INTO max_players;
  
  SELECT COUNT(*) INTO player_count
  FROM players
  WHERE team_id = NEW.team_id
    AND is_active = true;
  
  IF player_count >= max_players THEN
    RAISE EXCEPTION 'Player limit reached for % tier (% players per team).', 
      user_tier, max_players
      USING HINT = 'Upgrade your plan to add more players';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_player_limit"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_player_limit"() IS 'Trigger function to enforce player limits per team based on subscription tier';



CREATE OR REPLACE FUNCTION "public"."check_team_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  user_tier TEXT;
  user_status TEXT;
  team_count INTEGER;
  max_teams INTEGER;
BEGIN
  -- Get user's subscription tier and status (using user_id, not coach_id)
  SELECT subscription_tier, subscription_status INTO user_tier, user_status
  FROM users
  WHERE id = NEW.user_id;
  
  -- Check if subscription is active
  IF user_status NOT IN ('active', 'trialing') THEN
    RAISE EXCEPTION 'Your subscription is not active. Please renew to create teams.';
  END IF;
  
  -- Get max teams for this tier
  SELECT (get_tier_limits(user_tier)).max_teams INTO max_teams;
  
  -- Count active teams (using user_id, not coach_id)
  SELECT COUNT(*) INTO team_count
  FROM teams
  WHERE user_id = NEW.user_id
    AND is_active = true
    AND archived_at IS NULL;
  
  -- Check limit
  IF team_count >= max_teams THEN
    RAISE EXCEPTION 'Team limit reached for % tier (% teams). Please upgrade your subscription to add more teams.', 
      user_tier, max_teams
      USING HINT = 'Visit the Pricing page to upgrade your plan';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_team_limit"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_team_limit"() IS 'Trigger function to enforce team limits based on subscription tier';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_archived_items"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  archived_players_count INT;
  archived_categories_count INT;
  archived_teams_count INT;
BEGIN
  -- Archive players before deleting (move to archive table)
  INSERT INTO players_archive (
    id, team_id, category_id, name, position, jersey_number, 
    birth_date, notes, is_active, archived_at, created_at
  )
  SELECT 
    id, team_id, category_id, name, position, jersey_number, 
    birth_date, notes, is_active, archived_at, created_at
  FROM players
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';
  
  GET DIAGNOSTICS archived_players_count = ROW_COUNT;

  -- Now delete archived players
  DELETE FROM players
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';

  -- Archive categories before deleting
  INSERT INTO categories_archive (
    id, team_id, name, age_group, gender, season, notes, 
    is_active, archived_at, created_at
  )
  SELECT 
    id, team_id, name, age_group, gender, season, notes, 
    is_active, archived_at, created_at
  FROM categories
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';
  
  GET DIAGNOSTICS archived_categories_count = ROW_COUNT;

  -- Now delete archived categories
  DELETE FROM categories
  WHERE is_active = false 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';

  -- Archive teams before deleting
  INSERT INTO teams_archive (
    id, user_id, name, sport, age_group, season, notes, 
    is_archived, archived_at, created_at
  )
  SELECT 
    id, user_id, name, sport, age_group, season, notes, 
    is_archived, archived_at, created_at
  FROM teams
  WHERE is_archived = true 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';
  
  GET DIAGNOSTICS archived_teams_count = ROW_COUNT;

  -- Now delete archived teams
  DELETE FROM teams
  WHERE is_archived = true 
    AND archived_at IS NOT NULL 
    AND archived_at < NOW() - INTERVAL '365 days';

  RAISE NOTICE 'Cleanup completed: Archived % teams, % categories, % players before deletion', 
    archived_teams_count, archived_categories_count, archived_players_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_archived_items"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_archived_items"() IS 'Archives and then deletes teams, categories, and players that have been archived for more than 365 days. Data is preserved in archive tables.';



CREATE OR REPLACE FUNCTION "public"."cleanup_old_deactivated_users"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  archived_users_count INT;
BEGIN
  -- Archive users before deleting (move to archive table)
  INSERT INTO users_archive (
    id, email, name, phone, bio, user_type, plan_type,
    is_active, deactivated_at, deactivation_reason, created_at
  )
  SELECT 
    id, email, name, phone, bio, user_type, plan_type,
    is_active, deactivated_at, deactivation_reason, created_at
  FROM users
  WHERE is_active = false
    AND deactivated_at IS NOT NULL 
    AND deactivated_at < NOW() - INTERVAL '365 days';
  
  GET DIAGNOSTICS archived_users_count = ROW_COUNT;

  -- Now permanently delete users who have been deactivated for more than 365 days
  -- The CASCADE will delete all related data (teams, players, sessions, etc.)
  -- Note: Teams/categories/players should already be archived by cleanup_old_archived_items()
  DELETE FROM users
  WHERE is_active = false
    AND deactivated_at IS NOT NULL 
    AND deactivated_at < NOW() - INTERVAL '365 days';

  RAISE NOTICE 'Cleanup completed: Archived and deleted % deactivated users older than 365 days', archived_users_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_deactivated_users"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_deactivated_users"() IS 'Archives and then permanently deletes user accounts that have been deactivated for more than 365 days. User data is preserved in users_archive table.';



CREATE OR REPLACE FUNCTION "public"."deactivate_user_account"("user_id_param" "uuid", "reason_param" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Mark user as deactivated
  UPDATE users
  SET 
    is_active = false,
    deactivated_at = NOW(),
    deactivation_reason = reason_param,
    updated_at = NOW()
  WHERE id = user_id_param;

  -- Archive all user's teams (cascades to categories and players)
  UPDATE teams
  SET is_archived = true, archived_at = NOW()
  WHERE user_id = user_id_param AND is_archived = false;

  RAISE NOTICE 'User account deactivated. User must contact support to reactivate after 365 days.';
END;
$$;


ALTER FUNCTION "public"."deactivate_user_account"("user_id_param" "uuid", "reason_param" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."deactivate_user_account"("user_id_param" "uuid", "reason_param" "text") IS 'Deactivates a user account and archives all related data. User cannot login. Support can reactivate within 365 days.';



CREATE OR REPLACE FUNCTION "public"."ensure_profile_exists"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- On login, ensure profile exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email, name, phone, user_type, created_at, updated_at)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
      'coach',
      NOW(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_profile_exists"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ensure_profile_exists"() IS 'Ensures user profile exists on login. Creates profile if missing. Includes phone from metadata.';



CREATE OR REPLACE FUNCTION "public"."expire_trials"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE users
    SET 
      subscription_tier = 'free',
      subscription_status = 'expired',
      subscription_end_date = now()
    WHERE subscription_status = 'trialing'
      AND trial_ends_at < now()
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM expired;
  
  RETURN expired_count;
END;
$$;


ALTER FUNCTION "public"."expire_trials"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_session_attendance_summary"("session_id_param" "uuid") RETURNS TABLE("total_players" integer, "present_count" integer, "absent_count" integer, "attendance_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  total INT;
  present INT;
  absent INT;
  rate NUMERIC;
BEGIN
  -- Count total players marked for this session
  SELECT COUNT(*) INTO total
  FROM session_attendance
  WHERE session_id = session_id_param;
  
  -- Count present
  SELECT COUNT(*) INTO present
  FROM session_attendance
  WHERE session_id = session_id_param
    AND is_present = true;
  
  -- Count absent
  absent := total - present;
  
  -- Calculate rate
  IF total > 0 THEN
    rate := ROUND((present::NUMERIC / total::NUMERIC) * 100, 1);
  ELSE
    rate := 0;
  END IF;
  
  RETURN QUERY SELECT total, present, absent, rate;
END;
$$;


ALTER FUNCTION "public"."get_session_attendance_summary"("session_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_session_attendance_summary"("session_id_param" "uuid") IS 'Gets attendance summary for a specific session';



CREATE OR REPLACE FUNCTION "public"."get_tier_limits"("tier" "text") RETURNS TABLE("max_teams" integer, "max_players_per_team" integer, "max_ai_insights_per_month" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY SELECT
    CASE tier
      WHEN 'free' THEN 1
      WHEN 'pro' THEN 5
      WHEN 'premium' THEN 999999
      WHEN 'enterprise' THEN 999999
      ELSE 1
    END AS max_teams,
    CASE tier
      WHEN 'free' THEN 15
      WHEN 'pro' THEN 999999
      WHEN 'premium' THEN 999999
      WHEN 'enterprise' THEN 999999
      ELSE 15
    END AS max_players_per_team,
    CASE tier
      WHEN 'free' THEN 0
      WHEN 'pro' THEN 5
      WHEN 'premium' THEN 999999
      WHEN 'enterprise' THEN 999999
      ELSE 0
    END AS max_ai_insights_per_month;
END;
$$;


ALTER FUNCTION "public"."get_tier_limits"("tier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, user_type, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL), -- Extract phone from metadata
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'coach'), -- Default to coach
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Automatically creates user profile when auth user is created. Extracts name, phone, and user_type from signup metadata.';



CREATE OR REPLACE FUNCTION "public"."has_tier_access"("required_tier" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_tier TEXT;
  user_status TEXT;
BEGIN
  SELECT subscription_tier, subscription_status INTO user_tier, user_status
  FROM users
  WHERE id = auth.uid();
  
  IF user_status NOT IN ('active', 'trialing') THEN
    RETURN FALSE;
  END IF;
  
  RETURN CASE required_tier
    WHEN 'free' THEN TRUE
    WHEN 'pro' THEN user_tier IN ('pro', 'premium', 'enterprise')
    WHEN 'premium' THEN user_tier IN ('premium', 'enterprise')
    WHEN 'enterprise' THEN user_tier = 'enterprise'
    ELSE FALSE
  END;
END;
$$;


ALTER FUNCTION "public"."has_tier_access"("required_tier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_ai_insights_usage"("user_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_reset_at TIMESTAMP WITH TIME ZONE;
  current_count INTEGER;
BEGIN
  SELECT ai_insights_reset_at INTO current_reset_at
  FROM users
  WHERE id = user_id_param;
  
  IF current_reset_at < now() THEN
    UPDATE users
    SET 
      ai_insights_used = 1,
      ai_insights_reset_at = date_trunc('month', now() + interval '1 month')
    WHERE id = user_id_param;
  ELSE
    UPDATE users
    SET ai_insights_used = ai_insights_used + 1
    WHERE id = user_id_param;
  END IF;
END;
$$;


ALTER FUNCTION "public"."increment_ai_insights_usage"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reactivate_user_account"("user_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if user exists and is deactivated
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id_param 
      AND is_active = false
  ) THEN
    RAISE EXCEPTION 'User account is already active or does not exist.';
  END IF;

  -- Reactivate user
  UPDATE users
  SET 
    is_active = true,
    deactivated_at = NULL,
    deactivation_reason = NULL,
    updated_at = NOW()
  WHERE id = user_id_param;

  -- Restore user's teams
  UPDATE teams
  SET is_archived = false, archived_at = NULL
  WHERE user_id = user_id_param 
    AND archived_at IS NOT NULL;

  -- Restore categories
  UPDATE categories
  SET is_active = true, archived_at = NULL
  WHERE team_id IN (SELECT id FROM teams WHERE user_id = user_id_param)
    AND archived_at IS NOT NULL;

  -- Restore players
  UPDATE players
  SET is_active = true, archived_at = NULL
  WHERE team_id IN (SELECT id FROM teams WHERE user_id = user_id_param)
    AND archived_at IS NOT NULL;

  RAISE NOTICE 'User account reactivated successfully by support.';
END;
$$;


ALTER FUNCTION "public"."reactivate_user_account"("user_id_param" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reactivate_user_account"("user_id_param" "uuid") IS 'Reactivates a deactivated user account. Should only be called by admin/support staff.';



CREATE OR REPLACE FUNCTION "public"."record_subscription_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) OR 
     (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) THEN
    
    IF OLD.subscription_tier IS NOT NULL THEN
      UPDATE subscription_history
      SET ended_at = now()
      WHERE user_id = NEW.id
        AND ended_at IS NULL;
    END IF;
    
    INSERT INTO subscription_history (
      user_id,
      tier,
      status,
      started_at
    ) VALUES (
      NEW.id,
      NEW.subscription_tier,
      NEW.subscription_status,
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."record_subscription_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recreate_missing_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email, name, user_type, created_at, updated_at)
    VALUES (
      NEW.id, NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
      COALESCE(NEW.raw_user_meta_data->>'user_type', 'coach'),
      NOW(), NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."recreate_missing_profile"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."recreate_missing_profile"() IS 'Automatically recreates user profile if auth user exists but profile was deleted. Allows users to re-register after account deletion.';



CREATE OR REPLACE FUNCTION "public"."update_session_attendance_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_session_attendance_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."attendance" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "attendance_status_check" CHECK (("status" = ANY (ARRAY['present'::"text", 'absent'::"text", 'injured'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid",
    "name" "text" NOT NULL,
    "age_group" "text",
    "season" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "gender" "text",
    "archived_at" timestamp with time zone,
    CONSTRAINT "categories_gender_check" CHECK (("gender" = ANY (ARRAY['masculino'::"text", 'feminino'::"text", 'misto'::"text"])))
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."categories" IS 'Age group/division categories within teams (e.g., Sub-12, Sub-15)';



COMMENT ON COLUMN "public"."categories"."team_id" IS 'The team this category belongs to';



COMMENT ON COLUMN "public"."categories"."name" IS 'Category name (e.g., "Sub-12", "Juvenil")';



COMMENT ON COLUMN "public"."categories"."age_group" IS 'Age group code (e.g., "U-12", "U-15")';



COMMENT ON COLUMN "public"."categories"."season" IS 'Season or year (e.g., "2025", "2024/2025")';



COMMENT ON COLUMN "public"."categories"."is_active" IS 'Whether this category is currently active';



COMMENT ON COLUMN "public"."categories"."notes" IS 'Optional notes/description for the category';



COMMENT ON COLUMN "public"."categories"."gender" IS 'Category gender: masculino, feminino, or misto';



COMMENT ON COLUMN "public"."categories"."archived_at" IS 'Timestamp when the category was archived. Items older than 365 days are auto-deleted.';



CREATE TABLE IF NOT EXISTS "public"."categories_archive" (
    "id" "uuid" NOT NULL,
    "team_id" "uuid",
    "name" "text",
    "age_group" "text",
    "gender" "text",
    "season" "text",
    "notes" "text",
    "is_active" boolean,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "deleted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."categories_archive" OWNER TO "postgres";


COMMENT ON TABLE "public"."categories_archive" IS 'Archive of permanently deleted categories for audit/recovery purposes';



CREATE TABLE IF NOT EXISTS "public"."evaluations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "valence_id" "text" NOT NULL,
    "score" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "player_notes" "text",
    CONSTRAINT "evaluations_score_check" CHECK ((("score" >= 0) AND ("score" <= 5)))
);


ALTER TABLE "public"."evaluations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."evaluations"."valence_id" IS 'The valence/criteria being evaluated (e.g., passing, dribbling, etc.)';



COMMENT ON COLUMN "public"."evaluations"."score" IS 'Player score for this valence (0 = not evaluated, 1-5 = rating)';



COMMENT ON COLUMN "public"."evaluations"."player_notes" IS 'Player-specific observation notes';



CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "jersey_number" integer,
    "position" "text",
    "birth_date" "date",
    "photo_url" "text",
    "parent_name" "text",
    "parent_email" "text",
    "parent_phone" "text",
    "medical_notes" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category_id" "uuid",
    "notes" "text",
    "archived_at" timestamp with time zone,
    "dominant_leg" "text",
    CONSTRAINT "players_dominant_leg_check" CHECK (("dominant_leg" = ANY (ARRAY['left'::"text", 'right'::"text", 'both'::"text", 'Esquerda'::"text", 'Direita'::"text", 'Ambos'::"text"]))),
    CONSTRAINT "valid_position" CHECK ((("position" IS NULL) OR ("position" = ANY (ARRAY['Goleiro'::"text", 'Fixo'::"text", 'Ala'::"text", 'Pivô'::"text"]))))
);


ALTER TABLE "public"."players" OWNER TO "postgres";


COMMENT ON COLUMN "public"."players"."category_id" IS 'Optional category assignment. Players belong to teams (required) and can optionally be assigned to categories';



COMMENT ON COLUMN "public"."players"."notes" IS 'Optional notes/description for the player';



COMMENT ON COLUMN "public"."players"."archived_at" IS 'Timestamp when the player was archived. Items older than 365 days are auto-deleted.';



COMMENT ON COLUMN "public"."players"."dominant_leg" IS 'Player''s dominant leg: left, right, or both (Esquerda, Direita, Ambos)';



COMMENT ON CONSTRAINT "valid_position" ON "public"."players" IS 'Validates that position is one of the allowed futsal positions: Goleiro, Fixo, Ala, Pivô';



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "sport" "text" DEFAULT 'futsal'::"text",
    "age_group" "text",
    "location" "text",
    "is_archived" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "notes" "text",
    "season" "text",
    "archived_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "teams_sport_check" CHECK (("sport" = ANY (ARRAY['futsal'::"text", 'football'::"text", 'volleyball'::"text", 'basketball'::"text", 'handball'::"text"])))
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


COMMENT ON TABLE "public"."teams" IS 'Teams table with complete RLS policies: SELECT, INSERT, UPDATE, DELETE';



COMMENT ON COLUMN "public"."teams"."notes" IS 'Optional notes/description for the team';



COMMENT ON COLUMN "public"."teams"."season" IS 'Season or year (e.g., "2025", "2024/2025")';



COMMENT ON COLUMN "public"."teams"."archived_at" IS 'Timestamp when the team was archived. Items older than 365 days are auto-deleted.';



CREATE OR REPLACE VIEW "public"."player_assignments" AS
 SELECT "p"."id" AS "player_id",
    "p"."name" AS "player_name",
    "p"."position",
    "p"."jersey_number",
    "t"."id" AS "team_id",
    "t"."name" AS "team_name",
    "c"."id" AS "category_id",
    "c"."name" AS "category_name",
    "c"."age_group",
        CASE
            WHEN ("c"."id" IS NULL) THEN 'Team Level'::"text"
            ELSE 'Category Level'::"text"
        END AS "assignment_level"
   FROM (("public"."players" "p"
     JOIN "public"."teams" "t" ON (("t"."id" = "p"."team_id")))
     LEFT JOIN "public"."categories" "c" ON (("c"."id" = "p"."category_id")))
  WHERE ("p"."is_active" = true);


ALTER VIEW "public"."player_assignments" OWNER TO "postgres";


COMMENT ON VIEW "public"."player_assignments" IS 'Helpful view showing player team and category assignments';



CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_id" "uuid" NOT NULL,
    "date" timestamp with time zone NOT NULL,
    "selected_valences" "text"[] NOT NULL,
    "notes" "text",
    "location" "text",
    "duration_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category_id" "uuid",
    "duration_seconds" integer DEFAULT 0,
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "status" "text" DEFAULT 'completed'::"text",
    CONSTRAINT "sessions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'paused'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sessions"."notes" IS 'General session notes added by coach';



COMMENT ON COLUMN "public"."sessions"."category_id" IS 'Optional category filter for the session. NULL means session includes all team players.';



COMMENT ON COLUMN "public"."sessions"."duration_seconds" IS 'Total session duration in seconds';



COMMENT ON COLUMN "public"."sessions"."status" IS 'Current session status: active, paused, or completed';



CREATE OR REPLACE VIEW "public"."player_stats" AS
 SELECT "p"."id" AS "player_id",
    "p"."name" AS "player_name",
    "p"."team_id",
    "e"."valence_id" AS "valence",
    "count"("e"."id") AS "evaluation_count",
    "round"("avg"("e"."score"), 2) AS "average_score",
    "min"("e"."score") AS "min_score",
    "max"("e"."score") AS "max_score",
    "array_agg"("e"."score" ORDER BY "s"."date") AS "score_history",
    "array_agg"("s"."date" ORDER BY "s"."date") AS "evaluation_dates"
   FROM (("public"."players" "p"
     LEFT JOIN "public"."evaluations" "e" ON (("e"."player_id" = "p"."id")))
     LEFT JOIN "public"."sessions" "s" ON (("s"."id" = "e"."session_id")))
  WHERE ("p"."is_active" = true)
  GROUP BY "p"."id", "p"."name", "p"."team_id", "e"."valence_id";


ALTER VIEW "public"."player_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."players_archive" (
    "id" "uuid" NOT NULL,
    "team_id" "uuid",
    "category_id" "uuid",
    "name" "text",
    "position" "text",
    "jersey_number" integer,
    "birth_date" "date",
    "notes" "text",
    "is_active" boolean,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "deleted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."players_archive" OWNER TO "postgres";


COMMENT ON TABLE "public"."players_archive" IS 'Archive of permanently deleted players for audit/recovery purposes';



CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "player_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_premium" boolean DEFAULT false,
    "purchased_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_attendance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "is_present" boolean DEFAULT true NOT NULL,
    "arrival_time" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_attendance" OWNER TO "postgres";


COMMENT ON TABLE "public"."session_attendance" IS 'Tracks which players were present in each training session';



COMMENT ON COLUMN "public"."session_attendance"."is_present" IS 'Whether the player attended the session';



COMMENT ON COLUMN "public"."session_attendance"."arrival_time" IS 'When the player arrived (optional)';



COMMENT ON COLUMN "public"."session_attendance"."notes" IS 'Notes about attendance (late, injured, etc)';



CREATE TABLE IF NOT EXISTS "public"."session_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "selected_valences" "text"[] NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_templates" OWNER TO "postgres";


COMMENT ON TABLE "public"."session_templates" IS 'Reusable session templates with pre-selected valences';



CREATE OR REPLACE VIEW "public"."sessions_with_attendance" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"uuid" AS "team_id",
    NULL::timestamp with time zone AS "date",
    NULL::"text"[] AS "selected_valences",
    NULL::"text" AS "notes",
    NULL::"text" AS "location",
    NULL::integer AS "duration_minutes",
    NULL::timestamp with time zone AS "created_at",
    NULL::timestamp with time zone AS "updated_at",
    NULL::"uuid" AS "category_id",
    NULL::integer AS "duration_seconds",
    NULL::timestamp with time zone AS "started_at",
    NULL::timestamp with time zone AS "ended_at",
    NULL::"text" AS "status",
    NULL::bigint AS "total_players",
    NULL::bigint AS "present_count",
    NULL::bigint AS "absent_count",
    NULL::numeric AS "attendance_rate";


ALTER VIEW "public"."sessions_with_attendance" OWNER TO "postgres";


COMMENT ON VIEW "public"."sessions_with_attendance" IS 'Sessions with attendance statistics';



CREATE TABLE IF NOT EXISTS "public"."subscription_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tier" "text" NOT NULL,
    "status" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "reason" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscription_history_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'past_due'::"text", 'canceled'::"text", 'expired'::"text"]))),
    CONSTRAINT "subscription_history_tier_check" CHECK (("tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'premium'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."subscription_history" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."team_stats" AS
 SELECT "t"."id" AS "team_id",
    "t"."name" AS "team_name",
    "count"(DISTINCT "p"."id") AS "total_players",
    "count"(DISTINCT "s"."id") AS "total_sessions",
    "count"(DISTINCT "e"."id") AS "total_evaluations",
    "round"("avg"("e"."score"), 2) AS "team_average_score"
   FROM ((("public"."teams" "t"
     LEFT JOIN "public"."players" "p" ON ((("p"."team_id" = "t"."id") AND ("p"."is_active" = true))))
     LEFT JOIN "public"."sessions" "s" ON (("s"."team_id" = "t"."id")))
     LEFT JOIN "public"."evaluations" "e" ON (("e"."session_id" = "s"."id")))
  WHERE ("t"."is_archived" = false)
  GROUP BY "t"."id", "t"."name";


ALTER VIEW "public"."team_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams_archive" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "name" "text",
    "sport" "text",
    "age_group" "text",
    "season" "text",
    "notes" "text",
    "is_archived" boolean,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "deleted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."teams_archive" OWNER TO "postgres";


COMMENT ON TABLE "public"."teams_archive" IS 'Archive of permanently deleted teams for audit/recovery purposes';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "plan_type" "text" DEFAULT 'free'::"text",
    "user_type" "text" DEFAULT 'coach'::"text",
    "bio" "text",
    "profile_picture_url" "text",
    "is_active" boolean DEFAULT true,
    "deactivated_at" timestamp with time zone,
    "deactivation_reason" "text",
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "subscription_start_date" timestamp with time zone,
    "subscription_end_date" timestamp with time zone,
    "trial_ends_at" timestamp with time zone,
    "ai_insights_used" integer DEFAULT 0,
    "ai_insights_reset_at" timestamp with time zone DEFAULT "date_trunc"('month'::"text", ("now"() + '1 mon'::interval)),
    "years_experience" integer,
    "coaching_license" "text",
    "linkedin_url" "text",
    CONSTRAINT "bio_length_check" CHECK (("length"("bio") <= 500)),
    CONSTRAINT "users_coaching_license_check" CHECK (("coaching_license" = ANY (ARRAY['Pro'::"text", 'A'::"text", 'B'::"text", 'C'::"text", 'None'::"text"]))),
    CONSTRAINT "users_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['free'::"text", 'basic'::"text", 'premium'::"text"]))),
    CONSTRAINT "users_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'trialing'::"text", 'past_due'::"text", 'canceled'::"text", 'expired'::"text"]))),
    CONSTRAINT "users_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['free'::"text", 'pro'::"text", 'premium'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "users_user_type_check" CHECK (("user_type" = ANY (ARRAY['coach'::"text", 'player'::"text"]))),
    CONSTRAINT "users_years_experience_check" CHECK ((("years_experience" >= 0) AND ("years_experience" <= 50)))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


COMMENT ON TABLE "public"."users" IS 'User profiles with RLS policies: INSERT, SELECT, UPDATE, DELETE (own records only)';



COMMENT ON COLUMN "public"."users"."user_type" IS 'User type (coach/player). Currently all users are coaches. Column kept for future player portal feature.';



COMMENT ON COLUMN "public"."users"."bio" IS 'Coach biography/about section (max 500 characters)';



COMMENT ON COLUMN "public"."users"."profile_picture_url" IS 'URL to profile picture stored in Supabase Storage';



COMMENT ON COLUMN "public"."users"."is_active" IS 'Whether the user account is active. Deactivated accounts cannot login.';



COMMENT ON COLUMN "public"."users"."deactivated_at" IS 'Timestamp when the user was deactivated. After 365 days, user must contact support.';



COMMENT ON COLUMN "public"."users"."deactivation_reason" IS 'Optional reason provided by user when deactivating account.';



COMMENT ON COLUMN "public"."users"."years_experience" IS 'Number of years of coaching experience (0-50)';



COMMENT ON COLUMN "public"."users"."coaching_license" IS 'Coaching license type: Pro, A, B, C, or None';



COMMENT ON COLUMN "public"."users"."linkedin_url" IS 'LinkedIn profile or portfolio URL';



CREATE TABLE IF NOT EXISTS "public"."users_archive" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "name" "text",
    "phone" "text",
    "bio" "text",
    "user_type" "text",
    "plan_type" "text",
    "is_active" boolean,
    "deactivated_at" timestamp with time zone,
    "deactivation_reason" "text",
    "created_at" timestamp with time zone,
    "deleted_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users_archive" OWNER TO "postgres";


COMMENT ON TABLE "public"."users_archive" IS 'Archive of permanently deleted users for audit/recovery purposes';



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_session_id_player_id_key" UNIQUE ("session_id", "player_id");



ALTER TABLE ONLY "public"."categories_archive"
    ADD CONSTRAINT "categories_archive_pkey" PRIMARY KEY ("id", "deleted_at");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_session_id_player_id_valence_id_key" UNIQUE ("session_id", "player_id", "valence_id");



ALTER TABLE ONLY "public"."players_archive"
    ADD CONSTRAINT "players_archive_pkey" PRIMARY KEY ("id", "deleted_at");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_session_id_player_id_key" UNIQUE ("session_id", "player_id");



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_session_id_player_id_key" UNIQUE ("session_id", "player_id");



ALTER TABLE ONLY "public"."session_templates"
    ADD CONSTRAINT "session_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_templates"
    ADD CONSTRAINT "session_templates_user_id_name_key" UNIQUE ("user_id", "name");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams_archive"
    ADD CONSTRAINT "teams_archive_pkey" PRIMARY KEY ("id", "deleted_at");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "unique_team_name_per_user" UNIQUE ("user_id", "name");



COMMENT ON CONSTRAINT "unique_team_name_per_user" ON "public"."teams" IS 'Ensures team names are unique per user';



ALTER TABLE ONLY "public"."users_archive"
    ADD CONSTRAINT "users_archive_pkey" PRIMARY KEY ("id", "deleted_at");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_attendance_player_id" ON "public"."attendance" USING "btree" ("player_id");



CREATE INDEX "idx_attendance_session_id" ON "public"."attendance" USING "btree" ("session_id");



CREATE INDEX "idx_categories_archive_deleted_at" ON "public"."categories_archive" USING "btree" ("deleted_at");



CREATE INDEX "idx_categories_archive_team_id" ON "public"."categories_archive" USING "btree" ("team_id");



CREATE INDEX "idx_categories_gender" ON "public"."categories" USING "btree" ("gender");



CREATE INDEX "idx_categories_is_active" ON "public"."categories" USING "btree" ("is_active");



CREATE INDEX "idx_categories_team_id" ON "public"."categories" USING "btree" ("team_id");



CREATE INDEX "idx_evaluations_player_id" ON "public"."evaluations" USING "btree" ("player_id");



CREATE INDEX "idx_evaluations_player_valence_id" ON "public"."evaluations" USING "btree" ("player_id", "valence_id");



CREATE INDEX "idx_evaluations_session_id" ON "public"."evaluations" USING "btree" ("session_id");



CREATE INDEX "idx_players_active" ON "public"."players" USING "btree" ("is_active");



CREATE INDEX "idx_players_archive_deleted_at" ON "public"."players_archive" USING "btree" ("deleted_at");



CREATE INDEX "idx_players_archive_team_id" ON "public"."players_archive" USING "btree" ("team_id");



CREATE INDEX "idx_players_category_id" ON "public"."players" USING "btree" ("category_id");



CREATE INDEX "idx_players_dominant_leg" ON "public"."players" USING "btree" ("dominant_leg");



CREATE INDEX "idx_players_jersey" ON "public"."players" USING "btree" ("team_id", "jersey_number");



CREATE INDEX "idx_players_position" ON "public"."players" USING "btree" ("position") WHERE ("position" IS NOT NULL);



COMMENT ON INDEX "public"."idx_players_position" IS 'Improves query performance when filtering players by position';



CREATE INDEX "idx_players_team_id" ON "public"."players" USING "btree" ("team_id");



CREATE INDEX "idx_reports_player_id" ON "public"."reports" USING "btree" ("player_id");



CREATE INDEX "idx_reports_premium" ON "public"."reports" USING "btree" ("is_premium");



CREATE INDEX "idx_reports_session_id" ON "public"."reports" USING "btree" ("session_id");



CREATE INDEX "idx_session_attendance_created_at" ON "public"."session_attendance" USING "btree" ("created_at");



CREATE INDEX "idx_session_attendance_is_present" ON "public"."session_attendance" USING "btree" ("is_present");



CREATE INDEX "idx_session_attendance_player_id" ON "public"."session_attendance" USING "btree" ("player_id");



CREATE INDEX "idx_session_attendance_session_id" ON "public"."session_attendance" USING "btree" ("session_id");



CREATE INDEX "idx_session_templates_user_id" ON "public"."session_templates" USING "btree" ("user_id");



CREATE INDEX "idx_sessions_category_id" ON "public"."sessions" USING "btree" ("category_id");



CREATE INDEX "idx_sessions_date" ON "public"."sessions" USING "btree" ("date" DESC);



CREATE INDEX "idx_sessions_status" ON "public"."sessions" USING "btree" ("status");



CREATE INDEX "idx_sessions_team_category" ON "public"."sessions" USING "btree" ("team_id", "category_id");



CREATE INDEX "idx_sessions_team_date" ON "public"."sessions" USING "btree" ("team_id", "date" DESC);



CREATE INDEX "idx_sessions_team_id" ON "public"."sessions" USING "btree" ("team_id");



CREATE INDEX "idx_subscription_history_started_at" ON "public"."subscription_history" USING "btree" ("started_at");



CREATE INDEX "idx_subscription_history_tier" ON "public"."subscription_history" USING "btree" ("tier");



CREATE INDEX "idx_subscription_history_user_id" ON "public"."subscription_history" USING "btree" ("user_id");



CREATE INDEX "idx_teams_archive_deleted_at" ON "public"."teams_archive" USING "btree" ("deleted_at");



CREATE INDEX "idx_teams_archive_user_id" ON "public"."teams_archive" USING "btree" ("user_id");



CREATE INDEX "idx_teams_archived" ON "public"."teams" USING "btree" ("is_archived");



CREATE INDEX "idx_teams_is_active" ON "public"."teams" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_teams_sport" ON "public"."teams" USING "btree" ("sport");



CREATE INDEX "idx_teams_user_id" ON "public"."teams" USING "btree" ("user_id");



CREATE INDEX "idx_users_archive_deleted_at" ON "public"."users_archive" USING "btree" ("deleted_at");



CREATE INDEX "idx_users_archive_email" ON "public"."users_archive" USING "btree" ("email");



CREATE INDEX "idx_users_coaching_license" ON "public"."users" USING "btree" ("coaching_license") WHERE ("coaching_license" IS NOT NULL);



CREATE INDEX "idx_users_deactivated_at" ON "public"."users" USING "btree" ("deactivated_at") WHERE ("is_active" = false);



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_is_active" ON "public"."users" USING "btree" ("is_active");



CREATE INDEX "idx_users_plan_type" ON "public"."users" USING "btree" ("plan_type");



CREATE INDEX "idx_users_subscription_status" ON "public"."users" USING "btree" ("subscription_status");



CREATE INDEX "idx_users_subscription_tier" ON "public"."users" USING "btree" ("subscription_tier");



CREATE INDEX "idx_users_trial_ends_at" ON "public"."users" USING "btree" ("trial_ends_at") WHERE ("trial_ends_at" IS NOT NULL);



CREATE INDEX "idx_users_user_type" ON "public"."users" USING "btree" ("user_type");



CREATE OR REPLACE VIEW "public"."sessions_with_attendance" AS
 SELECT "s"."id",
    "s"."team_id",
    "s"."date",
    "s"."selected_valences",
    "s"."notes",
    "s"."location",
    "s"."duration_minutes",
    "s"."created_at",
    "s"."updated_at",
    "s"."category_id",
    "s"."duration_seconds",
    "s"."started_at",
    "s"."ended_at",
    "s"."status",
    "count"("sa"."id") AS "total_players",
    "count"("sa"."id") FILTER (WHERE ("sa"."is_present" = true)) AS "present_count",
    "count"("sa"."id") FILTER (WHERE ("sa"."is_present" = false)) AS "absent_count",
        CASE
            WHEN ("count"("sa"."id") > 0) THEN "round"(((("count"("sa"."id") FILTER (WHERE ("sa"."is_present" = true)))::numeric / ("count"("sa"."id"))::numeric) * (100)::numeric), 1)
            ELSE (0)::numeric
        END AS "attendance_rate"
   FROM ("public"."sessions" "s"
     LEFT JOIN "public"."session_attendance" "sa" ON (("s"."id" = "sa"."session_id")))
  GROUP BY "s"."id";



CREATE OR REPLACE TRIGGER "enforce_player_limit" BEFORE INSERT ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."check_player_limit"();



CREATE OR REPLACE TRIGGER "enforce_team_limit" BEFORE INSERT ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."check_team_limit"();



CREATE OR REPLACE TRIGGER "track_subscription_changes" AFTER UPDATE ON "public"."users" FOR EACH ROW WHEN ((("old"."subscription_tier" IS DISTINCT FROM "new"."subscription_tier") OR ("old"."subscription_status" IS DISTINCT FROM "new"."subscription_status"))) EXECUTE FUNCTION "public"."record_subscription_change"();



CREATE OR REPLACE TRIGGER "update_evaluations_updated_at" BEFORE UPDATE ON "public"."evaluations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_players_updated_at" BEFORE UPDATE ON "public"."players" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reports_updated_at" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_session_attendance_timestamp" BEFORE UPDATE ON "public"."session_attendance" FOR EACH ROW EXECUTE FUNCTION "public"."update_session_attendance_timestamp"();



CREATE OR REPLACE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendance"
    ADD CONSTRAINT "attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evaluations"
    ADD CONSTRAINT "evaluations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_attendance"
    ADD CONSTRAINT "session_attendance_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_templates"
    ADD CONSTRAINT "session_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can create attendance for own sessions" ON "public"."attendance" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."sessions"
     JOIN "public"."teams" ON (("teams"."id" = "sessions"."team_id")))
  WHERE (("sessions"."id" = "attendance"."session_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create categories for own teams" ON "public"."categories" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "categories"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create evaluations for own sessions" ON "public"."evaluations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."sessions"
     JOIN "public"."teams" ON (("teams"."id" = "sessions"."team_id")))
  WHERE (("sessions"."id" = "evaluations"."session_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create own teams" ON "public"."teams" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own templates" ON "public"."session_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create players in own teams" ON "public"."players" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "players"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create reports for own players" ON "public"."reports" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."players"
     JOIN "public"."teams" ON (("teams"."id" = "players"."team_id")))
  WHERE (("players"."id" = "reports"."player_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create sessions for own teams" ON "public"."sessions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "sessions"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create teams" ON "public"."teams" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete categories for own teams" ON "public"."categories" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "categories"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete evaluations for own sessions" ON "public"."evaluations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions"
     JOIN "public"."teams" ON (("teams"."id" = "sessions"."team_id")))
  WHERE (("sessions"."id" = "evaluations"."session_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own profile" ON "public"."users" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete own session attendance" ON "public"."session_attendance" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions" "s"
     JOIN "public"."teams" "t" ON (("s"."team_id" = "t"."id")))
  WHERE (("s"."id" = "session_attendance"."session_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own teams" ON "public"."teams" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own templates" ON "public"."session_templates" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete players in own teams" ON "public"."players" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "players"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete sessions for own teams" ON "public"."sessions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "sessions"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own session attendance" ON "public"."session_attendance" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."sessions" "s"
     JOIN "public"."teams" "t" ON (("s"."team_id" = "t"."id")))
  WHERE (("s"."id" = "session_attendance"."session_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own subscription history" ON "public"."subscription_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update attendance for own sessions" ON "public"."attendance" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions"
     JOIN "public"."teams" ON (("teams"."id" = "sessions"."team_id")))
  WHERE (("sessions"."id" = "attendance"."session_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update categories for own teams" ON "public"."categories" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "categories"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update evaluations for own sessions" ON "public"."evaluations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions"
     JOIN "public"."teams" ON (("teams"."id" = "sessions"."team_id")))
  WHERE (("sessions"."id" = "evaluations"."session_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own session attendance" ON "public"."session_attendance" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions" "s"
     JOIN "public"."teams" "t" ON (("s"."team_id" = "t"."id")))
  WHERE (("s"."id" = "session_attendance"."session_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own teams" ON "public"."teams" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own templates" ON "public"."session_templates" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update players in own teams" ON "public"."players" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "players"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update reports for own players" ON "public"."reports" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."players"
     JOIN "public"."teams" ON (("teams"."id" = "players"."team_id")))
  WHERE (("players"."id" = "reports"."player_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update sessions for own teams" ON "public"."sessions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "sessions"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view attendance for own sessions" ON "public"."attendance" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions"
     JOIN "public"."teams" ON (("teams"."id" = "sessions"."team_id")))
  WHERE (("sessions"."id" = "attendance"."session_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view categories for own teams" ON "public"."categories" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "categories"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view evaluations for own sessions" ON "public"."evaluations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions"
     JOIN "public"."teams" ON (("teams"."id" = "sessions"."team_id")))
  WHERE (("sessions"."id" = "evaluations"."session_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own session attendance" ON "public"."session_attendance" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."sessions" "s"
     JOIN "public"."teams" "t" ON (("s"."team_id" = "t"."id")))
  WHERE (("s"."id" = "session_attendance"."session_id") AND ("t"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own subscription history" ON "public"."subscription_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own teams" ON "public"."teams" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own templates" ON "public"."session_templates" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view players in own teams" ON "public"."players" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "players"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view reports for own players" ON "public"."reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."players"
     JOIN "public"."teams" ON (("teams"."id" = "players"."team_id")))
  WHERE (("players"."id" = "reports"."player_id") AND ("teams"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view sessions for own teams" ON "public"."sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."teams"
  WHERE (("teams"."id" = "sessions"."team_id") AND ("teams"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evaluations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_attendance" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."calculate_attendance_rate"("player_id_param" "uuid", "team_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_attendance_rate"("player_id_param" "uuid", "team_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_attendance_rate"("player_id_param" "uuid", "team_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_player_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_player_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_player_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_team_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_team_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_team_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_archived_items"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_archived_items"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_archived_items"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_deactivated_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_deactivated_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_deactivated_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deactivate_user_account"("user_id_param" "uuid", "reason_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."deactivate_user_account"("user_id_param" "uuid", "reason_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deactivate_user_account"("user_id_param" "uuid", "reason_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_profile_exists"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_profile_exists"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_profile_exists"() TO "service_role";



GRANT ALL ON FUNCTION "public"."expire_trials"() TO "anon";
GRANT ALL ON FUNCTION "public"."expire_trials"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."expire_trials"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_session_attendance_summary"("session_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_session_attendance_summary"("session_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_session_attendance_summary"("session_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tier_limits"("tier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_tier_limits"("tier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tier_limits"("tier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_tier_access"("required_tier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_tier_access"("required_tier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_tier_access"("required_tier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_ai_insights_usage"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_ai_insights_usage"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_ai_insights_usage"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."reactivate_user_account"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reactivate_user_account"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reactivate_user_account"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_subscription_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_subscription_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_subscription_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recreate_missing_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."recreate_missing_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recreate_missing_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_session_attendance_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_attendance_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_attendance_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";
























GRANT ALL ON TABLE "public"."attendance" TO "anon";
GRANT ALL ON TABLE "public"."attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."attendance" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."categories_archive" TO "anon";
GRANT ALL ON TABLE "public"."categories_archive" TO "authenticated";
GRANT ALL ON TABLE "public"."categories_archive" TO "service_role";



GRANT ALL ON TABLE "public"."evaluations" TO "anon";
GRANT ALL ON TABLE "public"."evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."player_assignments" TO "anon";
GRANT ALL ON TABLE "public"."player_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."player_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."player_stats" TO "anon";
GRANT ALL ON TABLE "public"."player_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."player_stats" TO "service_role";



GRANT ALL ON TABLE "public"."players_archive" TO "anon";
GRANT ALL ON TABLE "public"."players_archive" TO "authenticated";
GRANT ALL ON TABLE "public"."players_archive" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."session_attendance" TO "anon";
GRANT ALL ON TABLE "public"."session_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."session_attendance" TO "service_role";



GRANT ALL ON TABLE "public"."session_templates" TO "anon";
GRANT ALL ON TABLE "public"."session_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."session_templates" TO "service_role";



GRANT ALL ON TABLE "public"."sessions_with_attendance" TO "anon";
GRANT ALL ON TABLE "public"."sessions_with_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions_with_attendance" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_history" TO "anon";
GRANT ALL ON TABLE "public"."subscription_history" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_history" TO "service_role";



GRANT ALL ON TABLE "public"."team_stats" TO "anon";
GRANT ALL ON TABLE "public"."team_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."team_stats" TO "service_role";



GRANT ALL ON TABLE "public"."teams_archive" TO "anon";
GRANT ALL ON TABLE "public"."teams_archive" TO "authenticated";
GRANT ALL ON TABLE "public"."teams_archive" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."users_archive" TO "anon";
GRANT ALL ON TABLE "public"."users_archive" TO "authenticated";
GRANT ALL ON TABLE "public"."users_archive" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.recreate_missing_profile();


  create policy "Public avatars viewable"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'avatars'::text));



  create policy "Users can delete own avatars"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload own avatars"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



