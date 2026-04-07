-- 扩展 profiles 表
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_degree text,
  ADD COLUMN IF NOT EXISTS current_education text,
  ADD COLUMN IF NOT EXISTS school text,
  ADD COLUMN IF NOT EXISTS major text,
  ADD COLUMN IF NOT EXISTS cross_major boolean,
  ADD COLUMN IF NOT EXISTS gpa numeric(4,2),
  ADD COLUMN IF NOT EXISTS gpa_scale numeric(3,1) DEFAULT 4.0,
  ADD COLUMN IF NOT EXISTS language_type text,
  ADD COLUMN IF NOT EXISTS language_score jsonb,
  ADD COLUMN IF NOT EXISTS gre_gmat jsonb,
  ADD COLUMN IF NOT EXISTS internship text[],
  ADD COLUMN IF NOT EXISTS research text[],
  ADD COLUMN IF NOT EXISTS awards text[],
  ADD COLUMN IF NOT EXISTS target_country text[],
  ADD COLUMN IF NOT EXISTS target_year integer,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS ranking_req text,
  ADD COLUMN IF NOT EXISTS special_needs text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_summary text;

-- 创建 programs 表（院校项目库）
CREATE TABLE IF NOT EXISTS public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name text NOT NULL,
  university_name_cn text,
  program_name text NOT NULL,
  program_name_cn text,
  degree_type text NOT NULL,
  country text NOT NULL,
  qs_ranking integer,
  department text,
  duration text,
  tuition text,
  language_requirement jsonb,
  gpa_requirement numeric(3,1),
  gre_required boolean DEFAULT false,
  deadline jsonb,
  application_link text,
  required_materials text[],
  tags text[],
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read programs"
  ON public.programs FOR SELECT
  TO authenticated
  USING (true);

-- 创建 applications 表
CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'in_progress',
  target_round text,
  deadline date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own applications"
  ON public.applications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 创建 essays 表
CREATE TABLE IF NOT EXISTS public.essays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  essay_type text NOT NULL,
  title text,
  content text,
  version integer DEFAULT 1,
  status text DEFAULT 'draft',
  ai_model text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.essays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own essays"
  ON public.essays FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 创建 application_materials 表
CREATE TABLE IF NOT EXISTS public.application_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  material_type text NOT NULL,
  material_name text NOT NULL,
  status text DEFAULT 'pending',
  file_url text,
  essay_id uuid REFERENCES public.essays(id) ON DELETE SET NULL,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.application_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own application materials"
  ON public.application_materials FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_materials.application_id
      AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_materials.application_id
      AND a.user_id = auth.uid()
    )
  );

-- 创建 essay_conversations 表
CREATE TABLE IF NOT EXISTS public.essay_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  essay_id uuid REFERENCES public.essays(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.essay_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own essay conversations"
  ON public.essay_conversations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.essays e
      WHERE e.id = essay_conversations.essay_id
      AND e.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.essays e
      WHERE e.id = essay_conversations.essay_id
      AND e.user_id = auth.uid()
    )
  );

-- 创建 Supabase Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'user-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
