
-- Create storage bucket for onboarding document uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('onboarding-documents', 'onboarding-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their own folder
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload own documents' AND tablename = 'objects') THEN
    CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'onboarding-documents'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- Allow authenticated users to read their own files
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own documents' AND tablename = 'objects') THEN
    CREATE POLICY "Users can read own documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'onboarding-documents'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;
