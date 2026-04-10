CREATE TABLE IF NOT EXISTS public.school_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school TEXT NOT NULL,
  country TEXT NOT NULL,
  program TEXT NOT NULL,
  degree TEXT NOT NULL,
  field TEXT NOT NULL,
  duration TEXT,
  type TEXT,
  avg_score NUMERIC,
  require_gpa TEXT,
  require_lang TEXT,
  tuition TEXT,
  living_cost TEXT,
  link TEXT,
  scholarship TEXT,
  deadline TEXT,
  rolling_admission BOOLEAN DEFAULT false,
  application_materials TEXT,
  prestige INTEGER DEFAULT 3 CHECK (prestige >= 1 AND prestige <= 5),
  qs_ranking INTEGER,
  accept_list TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.school_programs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read school programs' AND tablename = 'school_programs') THEN
    CREATE POLICY "Anyone can read school programs"
    ON public.school_programs FOR SELECT TO authenticated USING (true);
  END IF;
END $$;
