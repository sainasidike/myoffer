
CREATE TABLE public.user_onboarding_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  target_degree TEXT,
  current_education TEXT,
  school TEXT,
  major TEXT,
  cross_major TEXT,
  gpa TEXT,
  language_type TEXT,
  language_score TEXT,
  gre_gmat TEXT,
  internship TEXT,
  research TEXT,
  awards TEXT,
  entrepreneurship TEXT,
  volunteer TEXT,
  overseas TEXT,
  other_activities TEXT,
  target_country TEXT,
  budget TEXT,
  target_year TEXT,
  scholarship TEXT,
  ranking_req TEXT,
  special_needs TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own onboarding profile"
  ON public.user_onboarding_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding profile"
  ON public.user_onboarding_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding profile"
  ON public.user_onboarding_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
