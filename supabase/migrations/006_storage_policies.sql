-- Storage bucket policies for project assets and content media

-- Ensure storage.objects has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy helper: allow users to read/write only within their projects folder
-- Expected object path: '<project_id>/<rest-of-path>'

-- Read policy for project-assets bucket
CREATE POLICY IF NOT EXISTS "read own project assets" ON storage.objects
  FOR SELECT USING (
    bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-assets')
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.owner_id = auth.uid()
        AND split_part(name, '/', 1) = p.id::text
    )
  );

-- Insert policy for project-assets bucket
CREATE POLICY IF NOT EXISTS "insert own project assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = (SELECT id FROM storage.buckets WHERE name = 'project-assets')
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.owner_id = auth.uid()
        AND split_part(name, '/', 1) = p.id::text
    )
  );

-- Read policy for content-media bucket
CREATE POLICY IF NOT EXISTS "read own content media" ON storage.objects
  FOR SELECT USING (
    bucket_id = (SELECT id FROM storage.buckets WHERE name = 'content-media')
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.owner_id = auth.uid()
        AND split_part(name, '/', 1) = p.id::text
    )
  );

-- Insert policy for content-media bucket
CREATE POLICY IF NOT EXISTS "insert own content media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = (SELECT id FROM storage.buckets WHERE name = 'content-media')
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.owner_id = auth.uid()
        AND split_part(name, '/', 1) = p.id::text
    )
  );