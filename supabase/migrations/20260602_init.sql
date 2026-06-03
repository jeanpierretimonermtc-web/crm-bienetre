-- ============================================
-- PROFILES (extension de auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name  text,
  locale     text DEFAULT 'fr',
  plan       text DEFAULT 'free',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile select" ON public.profiles;
DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name  text NOT NULL,
  email      text,
  phone      text,
  status     text DEFAULT 'prospect' CHECK (status IN ('prospect','active','inactive','vip')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own clients" ON public.clients;
CREATE POLICY "own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- NOTES
-- ============================================
CREATE TABLE IF NOT EXISTS public.notes (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id  uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own notes" ON public.notes;
CREATE POLICY "own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FOLLOWUPS
-- ============================================
CREATE TABLE IF NOT EXISTS public.followups (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id  uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content    text NOT NULL,
  due_date   date NOT NULL,
  done       boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own followups" ON public.followups;
CREATE POLICY "own followups" ON public.followups FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- RECOMMENDATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.recommendations (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id    uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  reason       text,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own recommendations" ON public.recommendations;
CREATE POLICY "own recommendations" ON public.recommendations FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER : crée le profil à chaque inscription
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, locale, plan, created_at, updated_at)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'locale', 'fr'),
    'free',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
