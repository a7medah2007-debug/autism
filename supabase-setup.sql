-- ============================================================
-- كلية علوم ذوي الاحتياجات الخاصة - جامعة بني سويف
-- إعداد قاعدة بيانات Supabase
-- نفّذ هذا الملف في محرر SQL بداخل Supabase Dashboard
-- ============================================================


-- ============================
-- 1. جدول site_data (مخزن البيانات)
-- ============================
CREATE TABLE IF NOT EXISTS public.site_data (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.site_data ENABLE ROW LEVEL SECURITY;

-- سياسة: الجميع يمكنهم القراءة
DROP POLICY IF EXISTS "Public read site_data" ON public.site_data;
CREATE POLICY "Public read site_data"
  ON public.site_data FOR SELECT USING (true);

-- سياسة: Service Role فقط يمكنه الكتابة (يطبَّق تلقائياً)


-- ============================
-- 2. جدول contact_messages (رسائل التواصل)
-- ============================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  phone      TEXT        DEFAULT '',
  subject    TEXT        DEFAULT '',
  title      TEXT        DEFAULT '',
  message    TEXT        NOT NULL,
  read       BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- سياسة: الجميع يمكنهم الإرسال (INSERT)
DROP POLICY IF EXISTS "Public insert messages" ON public.contact_messages;
CREATE POLICY "Public insert messages"
  ON public.contact_messages FOR INSERT WITH CHECK (true);

-- سياسة: Service Role يقرأ ويعدل الرسائل
-- (Service Role يتجاوز RLS تلقائياً)


-- ============================
-- 3. إدراج البيانات الابتدائية
-- ============================

-- أولاً: الأخبار
INSERT INTO public.site_data (key, value) VALUES (
  'news',
  '{
    "news": [
      {
        "id": "news_001",
        "title": "انطلاق الفصل الدراسي الجديد بكلية علوم ذوي الاحتياجات الخاصة",
        "summary": "استقبلت الكلية طلابها الجدد في مطلع الفصل الدراسي الجديد في أجواء من الحفاوة والترحيب، حيث نظمت الكلية حفل استقبال رسمياً للطلاب المستجدين.",
        "content": "استقبلت كلية علوم ذوي الاحتياجات الخاصة بجامعة بني سويف طلابها الجدد في مطلع الفصل الدراسي الجديد في أجواء من الحفاوة والترحيب. وقد نظمت الكلية حفل استقبال رسمياً للطلاب المستجدين بحضور عميد الكلية ورؤساء الأقسام وعدد من أعضاء هيئة التدريس.",
        "date": "2024-09-15",
        "image": "news/news_001.jpg",
        "category": "أخبار الكلية",
        "published": true
      },
      {
        "id": "news_002",
        "title": "ورشة عمل حول أحدث أساليب تعليم الأطفال التوحديين",
        "summary": "نظمت الكلية ورشة عمل متخصصة حول أحدث الأساليب والتقنيات المستخدمة في تعليم الأطفال التوحديين بمشاركة عدد من المتخصصين والباحثين.",
        "content": "نظمت كلية علوم ذوي الاحتياجات الخاصة ورشة عمل متخصصة حول أحدث الأساليب والتقنيات المستخدمة في تعليم الأطفال التوحديين. شارك في الورشة عدد من المتخصصين والباحثين من داخل الكلية وخارجها.",
        "date": "2024-10-05",
        "image": "news/news_002.jpg",
        "category": "ورش عمل",
        "published": true
      },
      {
        "id": "news_003",
        "title": "الكلية تحصل على اعتماد أكاديمي متميز من هيئة ضمان الجودة",
        "summary": "حصلت الكلية على اعتماد أكاديمي متميز من الهيئة القومية لضمان جودة التعليم والاعتماد.",
        "content": "حصلت كلية علوم ذوي الاحتياجات الخاصة بجامعة بني سويف على اعتماد أكاديمي متميز من الهيئة القومية لضمان جودة التعليم والاعتماد.",
        "date": "2024-11-20",
        "image": "news/news_003.jpg",
        "category": "إنجازات",
        "published": true
      },
      {
        "id": "news_004",
        "title": "زيارة وفد من وزارة التربية والتعليم لقسم التوحد",
        "summary": "استقبل قسم التوحد بالكلية وفداً رفيع المستوى من وزارة التربية والتعليم للاطلاع على أحدث ما توصل إليه القسم من أبحاث وبرامج علاجية.",
        "content": "استقبل قسم التوحد بكلية علوم ذوي الاحتياجات الخاصة وفداً رفيع المستوى من وزارة التربية والتعليم.",
        "date": "2024-12-10",
        "image": "news/news_004.jpg",
        "category": "زيارات",
        "published": true
      },
      {
        "id": "news_005",
        "title": "إطلاق برنامج الدبلوم المهني في تعليم ذوي الاحتياجات الخاصة",
        "summary": "أعلنت الكلية عن إطلاق برنامج الدبلوم المهني المتخصص في تعليم ذوي الاحتياجات الخاصة.",
        "content": "أعلنت كلية علوم ذوي الاحتياجات الخاصة بجامعة بني سويف عن إطلاق برنامج الدبلوم المهني المتخصص في تعليم ذوي الاحتياجات الخاصة.",
        "date": "2025-01-08",
        "image": "news/news_005.jpg",
        "category": "برامج أكاديمية",
        "published": true
      },
      {
        "id": "news_006",
        "title": "نتائج الفصل الدراسي الأول متاحة للاستعلام",
        "summary": "أعلنت الكلية عن إتاحة نتائج الفصل الدراسي الأول للاستعلام عبر بوابة الجامعة الإلكترونية.",
        "content": "أعلنت كلية علوم ذوي الاحتياجات الخاصة بجامعة بني سويف عن إتاحة نتائج الفصل الدراسي الأول للاستعلام عبر بوابة الجامعة الإلكترونية.",
        "date": "2025-02-01",
        "image": "news/news_006.jpg",
        "category": "إعلانات",
        "published": true
      }
    ],
    "categories": ["أخبار الكلية","ورش عمل","إنجازات","زيارات","برامج أكاديمية","إعلانات","مؤتمرات"]
  }'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();


-- ثانياً: الفعاليات
INSERT INTO public.site_data (key, value) VALUES (
  'events',
  '{
    "events": [
      {
        "id": "event_001",
        "title": "مؤتمر التوحد الأول على مستوى جامعة بني سويف",
        "summary": "مؤتمر علمي متخصص يجمع الباحثين والمتخصصين في مجال التوحد لمناقشة أحدث الأبحاث والتطورات العلمية.",
        "content": "تنظم كلية علوم ذوي الاحتياجات الخاصة مؤتمرها العلمي الأول المتخصص في اضطراب طيف التوحد.",
        "date_start": "2025-03-15",
        "date_end": "2025-03-16",
        "time": "09:00 صباحاً",
        "location": "قاعة المؤتمرات الكبرى - جامعة بني سويف",
        "image": "news/event_001.jpg",
        "category": "مؤتمرات",
        "status": "upcoming",
        "published": true
      },
      {
        "id": "event_002",
        "title": "ورشة عمل: التدخل المبكر للأطفال التوحديين",
        "summary": "ورشة عمل تطبيقية متخصصة في أساليب التدخل المبكر للأطفال التوحديين موجهة للمعلمين والأخصائيين.",
        "content": "تنظم الكلية ورشة عمل تطبيقية متخصصة في أساليب التدخل المبكر للأطفال التوحديين.",
        "date_start": "2025-04-05",
        "date_end": "2025-04-05",
        "time": "10:00 صباحاً",
        "location": "قاعة الندوات - كلية علوم ذوي الاحتياجات الخاصة",
        "image": "news/event_002.jpg",
        "category": "ورش عمل",
        "status": "upcoming",
        "published": true
      },
      {
        "id": "event_003",
        "title": "يوم مفتوح لأولياء أمور الطلاب",
        "summary": "يوم مفتوح يتيح لأولياء الأمور التعرف على مستوى أبنائهم الدراسي واللقاء بأعضاء هيئة التدريس.",
        "content": "تنظم الكلية يوماً مفتوحاً لأولياء أمور الطلاب بهدف تعزيز التواصل بين الكلية وأسر الطلاب.",
        "date_start": "2025-04-20",
        "date_end": "2025-04-20",
        "time": "11:00 صباحاً",
        "location": "كلية علوم ذوي الاحتياجات الخاصة",
        "image": "news/event_003.jpg",
        "category": "فعاليات",
        "status": "upcoming",
        "published": true
      },
      {
        "id": "event_004",
        "title": "حفل تخرج الدفعة السادسة",
        "summary": "حفل تخرج الدفعة السادسة من طلاب كلية علوم ذوي الاحتياجات الخاصة.",
        "content": "تحتفل كلية علوم ذوي الاحتياجات الخاصة بتخريج دفعتها السادسة من الطلاب.",
        "date_start": "2025-06-15",
        "date_end": "2025-06-15",
        "time": "05:00 مساءً",
        "location": "قاعة الاحتفالات الكبرى - جامعة بني سويف",
        "image": "news/event_004.jpg",
        "category": "احتفاليات",
        "status": "upcoming",
        "published": true
      },
      {
        "id": "event_005",
        "title": "ندوة علمية: تقنيات الذكاء الاصطناعي في خدمة ذوي الاحتياجات الخاصة",
        "summary": "ندوة علمية تناقش أحدث تطبيقات الذكاء الاصطناعي وكيفية توظيفها في خدمة ذوي الاحتياجات الخاصة.",
        "content": "تنظم الكلية ندوة علمية متخصصة تناقش أحدث تطبيقات الذكاء الاصطناعي وكيفية توظيفها في خدمة ذوي الاحتياجات الخاصة.",
        "date_start": "2025-05-10",
        "date_end": "2025-05-10",
        "time": "12:00 ظهراً",
        "location": "قاعة الندوات - كلية علوم ذوي الاحتياجات الخاصة",
        "image": "news/event_005.jpg",
        "category": "ندوات",
        "status": "upcoming",
        "published": true
      },
      {
        "id": "event_006",
        "title": "معرض مشاريع التخرج للعام الدراسي 2024-2025",
        "summary": "معرض سنوي لعرض مشاريع تخرج طلاب الكلية أمام لجنة من المتخصصين وأعضاء هيئة التدريس.",
        "content": "تنظم الكلية معرضها السنوي لمشاريع التخرج حيث يتاح للطلاب الفرصة لعرض مشاريعهم البحثية.",
        "date_start": "2025-05-25",
        "date_end": "2025-05-26",
        "time": "09:00 صباحاً",
        "location": "ردهة الكلية الرئيسية",
        "image": "news/event_006.jpg",
        "category": "معارض",
        "status": "upcoming",
        "published": true
      }
    ],
    "categories": ["مؤتمرات","ورش عمل","فعاليات","احتفاليات","ندوات","معارض","زيارات"]
  }'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();


-- ثالثاً: مشاريع التخرج
INSERT INTO public.site_data (key, value) VALUES (
  'projects',
  '{
    "projects": [
      {
        "id": "proj_001",
        "title": "فاعلية برنامج تدريبي قائم على التحليل التطبيقي للسلوك في تنمية مهارات التواصل لدى الأطفال التوحديين",
        "students": ["أحمد محمد السيد","منى علي حسن"],
        "supervisor": "أ.د. محمد أحمد عبد الله",
        "year": "2024",
        "semester": "الفصل الدراسي الأول",
        "specialization": "التوحد",
        "summary": "تهدف الدراسة إلى التحقق من فاعلية برنامج تدريبي قائم على التحليل التطبيقي للسلوك في تنمية مهارات التواصل.",
        "image": "projects/proj_001.jpg",
        "file": "",
        "published": true
      },
      {
        "id": "proj_002",
        "title": "أثر استخدام التكنولوجيا المساعدة في تحسين مهارات القراءة لدى ذوي صعوبات التعلم",
        "students": ["سارة خالد إبراهيم","عمر هشام فاروق","نادية سعيد عبد الله"],
        "supervisor": "د. وائل عصام فؤاد",
        "year": "2024",
        "semester": "الفصل الدراسي الأول",
        "specialization": "صعوبات التعلم",
        "summary": "تناولت الدراسة أثر استخدام التكنولوجيا المساعدة في تحسين مهارات القراءة والكتابة.",
        "image": "projects/proj_002.jpg",
        "file": "",
        "published": true
      },
      {
        "id": "proj_003",
        "title": "برنامج إرشادي لتخفيف حدة الضغوط النفسية لدى أمهات الأطفال ذوي اضطراب طيف التوحد",
        "students": ["ريم محمود عثمان","هبة الله أحمد نور"],
        "supervisor": "د. منى سعد الدين",
        "year": "2024",
        "semester": "الفصل الدراسي الثاني",
        "specialization": "التوحد",
        "summary": "هدفت الدراسة إلى بناء برنامج إرشادي وقياس فاعليته في تخفيف حدة الضغوط النفسية.",
        "image": "projects/proj_003.jpg",
        "file": "",
        "published": true
      },
      {
        "id": "proj_004",
        "title": "فاعلية التدريب على لغة الإشارة في تحسين التواصل الاجتماعي للأطفال ذوي الإعاقة السمعية",
        "students": ["محمد عادل رزق","إسلام طارق حسين"],
        "supervisor": "د. دينا حسام عمر",
        "year": "2024",
        "semester": "الفصل الدراسي الثاني",
        "specialization": "الإعاقة السمعية",
        "summary": "تهدف الدراسة إلى قياس فاعلية التدريب على لغة الإشارة في تحسين مهارات التواصل الاجتماعي.",
        "image": "projects/proj_004.jpg",
        "file": "",
        "published": true
      },
      {
        "id": "proj_005",
        "title": "أثر برنامج قائم على الألعاب التعليمية في تنمية المفاهيم الرياضية لدى الأطفال ذوي الإعاقة الذهنية البسيطة",
        "students": ["نهى عبد الفتاح سليم","مريم يوسف عبد الرحمن","أسماء جمال الدين"],
        "supervisor": "أ.د. خالد إبراهيم مصطفى",
        "year": "2023",
        "semester": "الفصل الدراسي الأول",
        "specialization": "الإعاقة الذهنية",
        "summary": "تناولت الدراسة أثر استخدام الألعاب التعليمية المنظمة في تنمية المفاهيم الرياضية.",
        "image": "projects/proj_005.jpg",
        "file": "",
        "published": true
      },
      {
        "id": "proj_006",
        "title": "فاعلية برنامج تدريبي في تحسين الكفاءة الذاتية لدى معلمي التربية الخاصة",
        "students": ["علاء الدين محمد صلاح","حسام الدين أحمد علي"],
        "supervisor": "أ.د. سمير محمود حسن",
        "year": "2023",
        "semester": "الفصل الدراسي الثاني",
        "specialization": "التربية الخاصة",
        "summary": "هدفت الدراسة إلى بناء برنامج تدريبي وقياس فاعليته في تحسين مستوى الكفاءة الذاتية.",
        "image": "projects/proj_006.jpg",
        "file": "",
        "published": true
      },
      {
        "id": "proj_007",
        "title": "دور الأسرة في تنمية الاستقلالية الوظيفية لدى الأبناء ذوي اضطراب طيف التوحد",
        "students": ["فاطمة الزهراء محمود","شيماء عبد الحميد"],
        "supervisor": "د. أحمد سامي النجار",
        "year": "2023",
        "semester": "الفصل الدراسي الأول",
        "specialization": "التوحد",
        "summary": "تناولت الدراسة دور الأسرة ومدى مشاركتها الفعلية في تنمية مهارات الاستقلالية الوظيفية.",
        "image": "projects/proj_007.jpg",
        "file": "",
        "published": true
      },
      {
        "id": "proj_008",
        "title": "فاعلية الدمج التعليمي في تحسين المهارات الاجتماعية لدى الأطفال ذوي الإعاقة البصرية",
        "students": ["محمد حسين البسيوني","آية الله رمضان فتحي"],
        "supervisor": "د. رانيا محمد الشريف",
        "year": "2023",
        "semester": "الفصل الدراسي الثاني",
        "specialization": "الإعاقة البصرية",
        "summary": "هدفت الدراسة إلى التحقق من فاعلية تطبيق الدمج التعليمي في تحسين المهارات الاجتماعية.",
        "image": "projects/proj_008.jpg",
        "file": "",
        "published": true
      }
    ],
    "years": ["2024","2023","2022","2021"],
    "specializations": ["التوحد","صعوبات التعلم","الإعاقة الذهنية","الإعاقة السمعية","الإعاقة البصرية","اضطرابات التواصل","التربية الخاصة"]
  }'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();


-- رابعاً: هيئة التدريس
INSERT INTO public.site_data (key, value) VALUES (
  'staff',
  '{
    "department_head": {
      "id": "head_001",
      "name": "أ.د. محمد أحمد عبد الله",
      "title": "أستاذ دكتور",
      "position": "رئيس القسم",
      "specialization": "تربية ذوي الاحتياجات الخاصة",
      "email": "head@specialneed.bsu.edu.eg",
      "phone": "082-XXXXXXX",
      "image": "staff/head.jpg",
      "cv": "",
      "bio": "أستاذ متخصص في مجال تربية ذوي الاحتياجات الخاصة وتعليم الأطفال التوحديين، يحمل خبرة تزيد عن عشرين عاماً في التدريس والبحث العلمي."
    },
    "professors": [
      {
        "id": "prof_001",
        "name": "أ.د. سمير محمود حسن",
        "title": "أستاذ دكتور",
        "position": "أستاذ",
        "specialization": "علم نفس ذوي الاحتياجات الخاصة",
        "email": "s.hassan@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/prof_001.jpg",
        "cv": "",
        "bio": ""
      },
      {
        "id": "prof_002",
        "name": "أ.د. هناء عبد الرحمن علي",
        "title": "أستاذ دكتور",
        "position": "أستاذ",
        "specialization": "اضطرابات النطق والكلام",
        "email": "h.ali@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/prof_002.jpg",
        "cv": "",
        "bio": ""
      },
      {
        "id": "prof_003",
        "name": "أ.د. خالد إبراهيم مصطفى",
        "title": "أستاذ دكتور",
        "position": "أستاذ",
        "specialization": "الإعاقة الذهنية والتأخر الدراسي",
        "email": "k.mostafa@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/prof_003.jpg",
        "cv": "",
        "bio": ""
      }
    ],
    "associate_professors": [
      {
        "id": "assoc_001",
        "name": "د. منى سعد الدين",
        "title": "دكتور",
        "position": "أستاذ مساعد",
        "specialization": "التوحد واضطرابات التواصل",
        "email": "m.saad@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/assoc_001.jpg",
        "cv": "",
        "bio": ""
      },
      {
        "id": "assoc_002",
        "name": "د. وائل عصام فؤاد",
        "title": "دكتور",
        "position": "أستاذ مساعد",
        "specialization": "صعوبات التعلم والقراءة",
        "email": "w.fouad@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/assoc_002.jpg",
        "cv": "",
        "bio": ""
      },
      {
        "id": "assoc_003",
        "name": "د. دينا حسام عمر",
        "title": "دكتور",
        "position": "أستاذ مساعد",
        "specialization": "الإعاقة السمعية ولغة الإشارة",
        "email": "d.omar@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/assoc_003.jpg",
        "cv": "",
        "bio": ""
      }
    ],
    "lecturers": [
      {
        "id": "lect_001",
        "name": "د. أحمد سامي النجار",
        "title": "دكتور",
        "position": "مدرس",
        "specialization": "اضطراب طيف التوحد",
        "email": "a.najjar@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/lect_001.jpg",
        "cv": "",
        "bio": ""
      },
      {
        "id": "lect_002",
        "name": "د. رانيا محمد الشريف",
        "title": "دكتور",
        "position": "مدرس",
        "specialization": "الإعاقة البصرية والدمج التعليمي",
        "email": "r.elsherif@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/lect_002.jpg",
        "cv": "",
        "bio": ""
      }
    ],
    "assistants": [
      {
        "id": "asst_001",
        "name": "م. علاء حمدي رمضان",
        "title": "",
        "position": "معيد",
        "specialization": "تربية خاصة",
        "email": "a.hamdy@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/asst_001.jpg",
        "cv": "",
        "bio": ""
      },
      {
        "id": "asst_002",
        "name": "م. نور هاني سليمان",
        "title": "",
        "position": "معيد",
        "specialization": "علم نفس",
        "email": "n.hany@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/asst_002.jpg",
        "cv": "",
        "bio": ""
      },
      {
        "id": "asst_003",
        "name": "م. كريم طارق البنا",
        "title": "",
        "position": "مدرس مساعد",
        "specialization": "تقنيات التعليم",
        "email": "k.elbanna@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/asst_003.jpg",
        "cv": "",
        "bio": ""
      },
      {
        "id": "asst_004",
        "name": "م. إيمان يوسف حسانين",
        "title": "",
        "position": "مدرس مساعد",
        "specialization": "تربية خاصة",
        "email": "i.hasanin@specialneed.bsu.edu.eg",
        "phone": "",
        "image": "staff/asst_004.jpg",
        "cv": "",
        "bio": ""
      }
    ]
  }'
) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();


-- خامساً: السلايدر (قيمة افتراضية فارغة - يعبّئها الأدمن)
INSERT INTO public.site_data (key, value) VALUES (
  'slider',
  '[]'
) ON CONFLICT (key) DO NOTHING;


-- سادساً: إعدادات الأدمن (قيم افتراضية)
INSERT INTO public.site_data (key, value) VALUES (
  'admin_settings',
  '{
    "adminUser": "dr-ahmed",
    "siteName": "كلية علوم ذوي الاحتياجات الخاصة",
    "siteEmail": "info@specialneed.bsu.edu.eg",
    "sitePhone": "082-XXXXXXX"
  }'
) ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- ملاحظات:
-- 1. الجدولان site_data و contact_messages تم إنشاؤهما
-- 2. البيانات الابتدائية تم إدراجها
-- 3. بيانات الدخول: dr-ahmed / autism@2026
-- 4. RLS مفعّل - الأنون يقرأ فقط، Service Role يكتب
-- ============================================================
