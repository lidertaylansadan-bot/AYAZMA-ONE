-- Check if personal_tasks table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'personal_tasks'
);

-- If you need to apply the migration, run this from your Supabase SQL editor:
-- Copy the contents of supabase/migrations/010_personal_tasks.sql
