-- ============================================================
-- تحديث سياسات RLS + إنشاء مستخدم الأدمن
-- نفّذ هذا الملف في Supabase Dashboard → SQL Editor
-- ============================================================


-- ============================
-- 1. تحديث سياسات site_data
-- ============================

-- حذف السياسات القديمة
DROP POLICY IF EXISTS "Public read site_data"        ON public.site_data;
DROP POLICY IF EXISTS "Public can read"              ON public.site_data;
DROP POLICY IF EXISTS "Service role can write"       ON public.site_data;

-- القراءة: مفتوحة للجميع (الزوار يشاهدون الأخبار والبيانات)
CREATE POLICY "Anyone reads site_data"
  ON public.site_data
  FOR SELECT
  USING (true);

-- الإضافة: المستخدمون المسجّلون فقط
CREATE POLICY "Auth users insert site_data"
  ON public.site_data
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- التعديل: المستخدمون المسجّلون فقط
CREATE POLICY "Auth users update site_data"
  ON public.site_data
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- الحذف: المستخدمون المسجّلون فقط
CREATE POLICY "Auth users delete site_data"
  ON public.site_data
  FOR DELETE
  USING (auth.role() = 'authenticated');


-- ============================
-- 2. تحديث سياسات contact_messages
-- ============================

DROP POLICY IF EXISTS "Public insert messages"      ON public.contact_messages;
DROP POLICY IF EXISTS "Public can insert"           ON public.contact_messages;
DROP POLICY IF EXISTS "Service can manage"          ON public.contact_messages;

-- الإرسال: مفتوح للجميع (زوار الموقع يرسلون رسائل)
CREATE POLICY "Anyone submits message"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- القراءة والتعديل: الأدمن المسجّل فقط
CREATE POLICY "Auth users manage messages"
  ON public.contact_messages
  FOR ALL
  USING (auth.role() = 'authenticated');


-- ============================
-- 3. إنشاء مستخدم الأدمن في Supabase Auth
-- ============================
-- لا يمكن إنشاء مستخدمي Auth مباشرةً عبر SQL بشكل مضمون.
-- اتّبع الخطوات التالية بدلاً من ذلك:
--
--   أ) افتح: Supabase Dashboard → Authentication → Users
--   ب) اضغط "Add user" → "Create new user"
--   ج) أدخل البيانات:
--        Email    : dr-ahmed@specialneed.bsu.edu.eg
--        Password : autism@2026
--   د) اضغط "Create user"
--
-- بعدها يمكنك تسجيل الدخول من لوحة التحكم بـ:
--   اسم المستخدم : dr-ahmed          (أو الإيميل الكامل)
--   كلمة المرور  : autism@2026
-- ============================================================


-- ============================
-- 4. التحقق من إعداد RLS
-- ============================
-- للتأكد من أن RLS مفعّل على الجداول:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('site_data', 'contact_messages');
-- يجب أن يظهر rowsecurity = true للجدولين
