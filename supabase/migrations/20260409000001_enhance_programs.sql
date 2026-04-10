-- 增强 programs 表，支持确定性选校算法
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS field text,
  ADD COLUMN IF NOT EXISTS program_type text DEFAULT '授课型',
  ADD COLUMN IF NOT EXISTS avg_score numeric(5,1),
  ADD COLUMN IF NOT EXISTS require_lang jsonb,
  ADD COLUMN IF NOT EXISTS living_cost text,
  ADD COLUMN IF NOT EXISTS scholarship jsonb,
  ADD COLUMN IF NOT EXISTS rolling_admission boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prestige integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS accept_list jsonb,
  ADD COLUMN IF NOT EXISTS notes text;

-- 从现有 language_requirement 迁移数据到 require_lang
UPDATE programs
  SET require_lang = language_requirement
  WHERE language_requirement IS NOT NULL AND require_lang IS NULL;
