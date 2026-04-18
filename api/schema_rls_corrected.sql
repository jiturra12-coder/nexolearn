-- ============================================
-- CORRECTED RLS POLICIES FOR PROFILES TABLE
-- ============================================

-- Activar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar policies antiguas
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_secure" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;

-- ============================================
-- SELECT POLICIES (READ ACCESS)
-- ============================================

-- SELECT: Usuario autenticado puede ver TODOS los perfiles públicos
-- Esto permite el algoritmo de emparejamiento
CREATE POLICY "profiles_select_public"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ============================================
-- INSERT POLICIES (CREATE)
-- ============================================

-- INSERT: Solo puede crear su propio perfil
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- UPDATE POLICIES (EDIT)
-- ============================================

-- UPDATE: Solo puede modificar su propio perfil
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- DELETE POLICIES (REMOVE)
-- ============================================

-- DELETE: Solo puede eliminar su propio perfil (opcional: puede bloquearse completamente)
CREATE POLICY "profiles_delete_own"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- ============================================
-- RLS POLICIES FOR MESSAGES TABLE
-- ============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- DROP old policies
DROP POLICY IF EXISTS "messages_anyone_read" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;

-- SELECT: Cualquier usuario autenticado puede ver todos los mensajes
CREATE POLICY "messages_select_all"
ON public.messages
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Solo puede insertar mensajes propios
CREATE POLICY "messages_insert_own"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- DELETE: Solo puede eliminar sus propios mensajes
CREATE POLICY "messages_delete_own"
ON public.messages
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR MATCHES TABLE
-- ============================================

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- DROP old policies
DROP POLICY IF EXISTS "matches_select_own" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_own" ON public.matches;
DROP POLICY IF EXISTS "matches_update_own" ON public.matches;

-- SELECT: Usuario solo ve sus propios matches
CREATE POLICY "matches_select_own"
ON public.matches
FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- INSERT: Cualquier usuario autenticado puede crear matches (pero solo los suyos)
CREATE POLICY "matches_insert_own"
ON public.matches
FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- UPDATE: Solo puede actualizar sus propios matches
CREATE POLICY "matches_update_own"
ON public.matches
FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id)
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- DELETE: Solo puede eliminar sus propios matches
CREATE POLICY "matches_delete_own"
ON public.matches
FOR DELETE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================
-- RLS POLICIES FOR TRANSACTIONS TABLE
-- ============================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;

-- SELECT: Usuario solo ve sus propias transacciones
CREATE POLICY "transactions_select_own"
ON public.transactions
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- RLS POLICIES FOR CREDITS TABLE
-- ============================================

ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "credits_select_own" ON public.credits;

-- SELECT: Usuario solo ve sus propios créditos
CREATE POLICY "credits_select_own"
ON public.credits
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- SUMMARY OF SECURITY LEVELS
-- ============================================
/*
PROFILES:
  - SELECT: ✅ Todos los usuarios autenticados pueden ver todos los perfiles
            (Necesario para el algoritmo de emparejamiento)
  - INSERT: 🔒 Solo el usuario propietario
  - UPDATE: 🔒 Solo el usuario propietario
  - DELETE: 🔒 Solo el usuario propietario

MESSAGES:
  - SELECT: ✅ Todos los usuarios autenticados ven todos los mensajes
            (Chat público para todos)
  - INSERT: 🔒 Solo el usuario propietario
  - DELETE: 🔒 Solo el usuario propietario

MATCHES:
  - SELECT: 🔒 Solo los usuarios involucrados en el match
  - INSERT: 🔒 Solo los usuarios involucrados
  - UPDATE: 🔒 Solo los usuarios involucrados
  - DELETE: 🔒 Solo los usuarios involucrados

TRANSACTIONS:
  - SELECT: 🔒 Solo el usuario propietario

CREDITS:
  - SELECT: 🔒 Solo el usuario propietario
*/
