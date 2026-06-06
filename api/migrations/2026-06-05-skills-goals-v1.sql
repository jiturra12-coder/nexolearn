-- Skills & Goals V1 — Match Engine foundation
-- Tables: skills (catalog), user_teach_skills, user_learning_goals

-- ─── Skills catalog ───
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT skills_name_normalized_unique UNIQUE (name_normalized)
);

CREATE INDEX IF NOT EXISTS idx_skills_name_normalized ON skills (name_normalized);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills (category);

-- ─── Teach skills (user can teach) ───
CREATE TABLE IF NOT EXISTS user_teach_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('basico', 'intermedio', 'avanzado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_teach_skills_user_skill_unique UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_teach_skills_user_id ON user_teach_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_user_teach_skills_skill_id ON user_teach_skills (skill_id);

-- ─── Learning goals (user wants to learn) ───
CREATE TABLE IF NOT EXISTS user_learning_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('principiante', 'intermedio', 'avanzado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_learning_goals_user_skill_unique UNIQUE (user_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_learning_goals_user_id ON user_learning_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_user_learning_goals_skill_id ON user_learning_goals (skill_id);

-- ─── RLS ───
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_teach_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_goals ENABLE ROW LEVEL SECURITY;

-- Skills catalog: readable by authenticated users; insert for catalog growth
DROP POLICY IF EXISTS "skills_select_authenticated" ON skills;
CREATE POLICY "skills_select_authenticated" ON skills
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "skills_insert_authenticated" ON skills;
CREATE POLICY "skills_insert_authenticated" ON skills
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Teach skills: own rows only
DROP POLICY IF EXISTS "user_teach_skills_select_own" ON user_teach_skills;
CREATE POLICY "user_teach_skills_select_own" ON user_teach_skills
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_teach_skills_select_public" ON user_teach_skills;
CREATE POLICY "user_teach_skills_select_public" ON user_teach_skills
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "user_teach_skills_insert_own" ON user_teach_skills;
CREATE POLICY "user_teach_skills_insert_own" ON user_teach_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_teach_skills_delete_own" ON user_teach_skills;
CREATE POLICY "user_teach_skills_delete_own" ON user_teach_skills
  FOR DELETE USING (auth.uid() = user_id);

-- Learning goals: own rows + readable for matching prep
DROP POLICY IF EXISTS "user_learning_goals_select_own" ON user_learning_goals;
CREATE POLICY "user_learning_goals_select_own" ON user_learning_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_learning_goals_select_public" ON user_learning_goals;
CREATE POLICY "user_learning_goals_select_public" ON user_learning_goals
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "user_learning_goals_insert_own" ON user_learning_goals;
CREATE POLICY "user_learning_goals_insert_own" ON user_learning_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_learning_goals_delete_own" ON user_learning_goals;
CREATE POLICY "user_learning_goals_delete_own" ON user_learning_goals
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Seed catalog (idempotent) ───
INSERT INTO skills (name, name_normalized, category)
VALUES
  ('Guitarra', 'guitarra', 'Música'),
  ('Piano', 'piano', 'Música'),
  ('Inglés', 'inglés', 'Idiomas'),
  ('Francés', 'francés', 'Idiomas'),
  ('Programación', 'programación', 'Tecnología'),
  ('JavaScript', 'javascript', 'Tecnología'),
  ('Python', 'python', 'Tecnología'),
  ('Diseño UX', 'diseño ux', 'Diseño'),
  ('Fotografía', 'fotografía', 'Arte'),
  ('Cocina', 'cocina', 'Gastronomía'),
  ('Marketing digital', 'marketing digital', 'Negocios'),
  ('Contabilidad', 'contabilidad', 'Negocios'),
  ('Yoga', 'yoga', 'Bienestar'),
  ('Oratoria', 'oratoria', 'Desarrollo personal'),
  ('Excel', 'excel', 'Productividad')
ON CONFLICT (name_normalized) DO NOTHING;
