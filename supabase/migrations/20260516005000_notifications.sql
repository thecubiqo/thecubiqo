-- Migration: 20260516005000_notifications.sql
-- Creates the canonical notifications system (25+ notification types, 6 channels).
-- Source: CubiQo-Notifications-FuncReq.md §6
--
-- Note: push_notifications table (from 20260510070000_cowork_gap_features.sql) is a legacy
-- prototype used by the old job pipeline. This new `notifications` table is the canonical
-- cross-platform notification store for all CubiQo notification types.

-- ─────────────────────────────────────────────────────────────────────────────
-- § 1 — Notifications (all notification records, all types, all channels)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification type — matches canonical types from Notifications spec §2
  -- Task & Project:    task_completed, task_blocked, task_waiting_approval,
  --                    task_approved, task_rejected, project_completed, project_stalled
  -- Capsule & RGY:     capsule_ready, rgy_drift_alert, success_milestone,
  --                    color_shift_green, color_shift_red
  -- Social:            friend_request, friend_accepted, new_dm, chatroom_mention
  -- System & Security: connector_auth_expired, budget_warning, budget_exceeded,
  --                    security_alert, app_update
  -- Proactive / AI:    morning_briefing, proactive_check_in, aha_moment,
  --                    intervention_nudge, briefing_call, urgent_call, wakeup_call
  type                    text NOT NULL,

  title                   text NOT NULL,
  body                    text,

  -- Primary CTA
  action_url              text,
  action_label            text,

  -- Secondary CTA (e.g. "Snooze 1h" alongside "View Task")
  secondary_action_url    text,
  secondary_action_label  text,

  -- Delivery channels requested: subset of ['push','desktop','in_app','email','sms','call']
  channel                 text[] DEFAULT ARRAY['in_app'],

  -- Read state (null = unread)
  read_at                 timestamptz,

  -- User tapped primary action
  actioned_at             timestamptz,

  created_at              timestamptz DEFAULT now(),

  -- Optional TTL — expired notifications suppressed in UI (e.g. approval gate notifications)
  expires_at              timestamptz
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fast unread badge count query
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Feed query (all notifications for a user, newest first)
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications(user_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- § 2 — Notification Preferences (per-user per-type per-channel settings)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- Per-type, per-channel toggles
  -- Shape: { "task_completed": { "push": true, "email": false, "in_app": true }, ... }
  -- Unspecified types default to push: true, in_app: true, all other channels: false
  preferences   jsonb DEFAULT '{}',

  -- Do Not Disturb window (in user's local time)
  -- Notifications suppressed during this window except urgent_call and security_alert
  dnd_start     time,
  dnd_end       time,

  -- Call-eligible channels (require explicit opt-in; default OFF for all)
  briefing_call boolean DEFAULT false,   -- morning briefing delivered as phone call
  urgent_call   boolean DEFAULT false,   -- urgent task/approval delivered as phone call
  wakeup_call   boolean DEFAULT false,   -- morning wakeup call (if no response to push)

  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- § 3 — Auto-provision preferences row when a user is created
-- ─────────────────────────────────────────────────────────────────────────────
-- (Trigger fires on auth.users insert; same pattern as profiles auto-create)
-- NOTE: Only add this if you don't already have a user-creation trigger.
-- If you do, add notification_preferences provisioning there instead.

CREATE OR REPLACE FUNCTION public.handle_new_user_notification_prefs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_notif_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notif_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notification_prefs();
