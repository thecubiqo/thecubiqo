-- RESET SCRIPT
-- RUN THIS TO WIPE ALL STAGING / DUMMY DATA
-- WARNING: This deletes all Social Army and Messaging data.

-- 1. Wipe Social Army Data
TRUNCATE TABLE content_queue CASCADE;
TRUNCATE TABLE social_campaigns CASCADE;
TRUNCATE TABLE social_accounts CASCADE;

-- 2. Wipe Messaging Data (Optional - comment out if you want to keep conversations)
TRUNCATE TABLE cq_messages CASCADE;
TRUNCATE TABLE cq_conversations CASCADE;
TRUNCATE TABLE cq_calls CASCADE;
TRUNCATE TABLE cq_notifications CASCADE;
TRUNCATE TABLE cq_contacts CASCADE;
TRUNCATE TABLE cq_friend_requests CASCADE;
TRUNCATE TABLE cq_numbers CASCADE;

-- 3. Wipe Subscriptions (Optional)
TRUNCATE TABLE user_subscriptions CASCADE;

-- 4. Reset Feature Flags (Optional - reset to default)
-- DELETE FROM features_catalog WHERE feature_key LIKE 'social_army.%';

COMMIT;

-- VERIFICATION
SELECT count(*) as campaigns_remaining FROM social_campaigns;
-- Should return 0
