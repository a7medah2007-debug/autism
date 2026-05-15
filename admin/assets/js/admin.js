/* ============================================
   لوحة تحكم كلية علوم ذوي الاحتياجات الخاصة
   الملف: admin.js
   الوصف: الوظائف المشتركة للوحة التحكم
   ============================================ */

'use strict';

/* ============================================
   1. إعدادات الأدمن
   ============================================ */
const ADMIN_CONFIG = {
  user:     'dr-ahmed',
  email:    'dr-ahmed@specialneed.bsu.edu.eg',
  pass:     'autism@2026',
  siteName: 'كلية علوم ذوي الاحتياجات الخاصة',
  version:  '1.0.0'
};

/* ============================================
   2. Supabase - Anon Key فقط (آمن للمتصفح)
   الكتابة محمية بـ RLS + Supabase Auth
   ============================================ */
const _ADMIN_SB_URL = 'https://taplgfctwktiwikiyjhr.supabase.co';
const _ADMIN_SB_KEY = 'sb_publishable_brFIWbJS5eXa2liIySOxlA_NCrDwFQD';

let _sbAdmin = null;
const _sbAdminReady = new Promise(resolve => {
  /* إخفاء الصفحة حتى يتأكد الـ Auth — يمنع وميض المحتوى */
  if (!window.location.pathname.includes('login')) {
    document.documentElement.style.visibility = 'hidden';
  }
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.onload = () => {
    try { _sbAdmin = window.supabase.createClient(_ADMIN_SB_URL, _ADMIN_SB_KEY); } catch (_) {}
    resolve();
  };
  s.onerror = () => resolve();
  document.head.appendChild(s);
});

/* بوابة Auth المبكرة - تعمل فور تحميل Supabase */
_sbAdminReady.then(async () => {
  const onLogin = window.location.pathname.includes('login');

  if (!_sbAdmin) {
    /* Fallback: sessionStorage لو Supabase لم يُحمَّل */
    if (!onLogin && sessionStorage.getItem('bsu_admin') !== 'true') {
      window.location.href = 'login.html';
      return;
    }
    document.documentElement.style.visibility = 'visible';
    return;
  }

  const { data: { session } } = await _sbAdmin.auth.getSession();

  if (onLogin) {
    if (session) window.location.href = 'dashboard.html'; /* مسجّل بالفعل */
    document.documentElement.style.visibility = 'visible';
    return;
  }

  if (!session) {
    window.location.href = 'login.html';
    return;
  }
  document.documentElement.style.visibility = 'visible';
});

const SITE_DATA_PATH = '../data/';

/* ============================================
   3. Auth - Supabase Auth الحقيقي
   ============================================ */

/* checkAuth: تعاملت معها بوابة Auth المبكرة أعلاه
   محتفَظ بها هنا للتوافق مع صفحات الأدمن القديمة */
function checkAuth() { /* no-op — handled by early gate */ }

/* تسجيل الدخول عبر Supabase Auth */
async function login(usernameOrEmail, pass) {
  await _sbAdminReady;
  if (!_sbAdmin) {
    /* Fallback بسيط لو Supabase غير متاح */
    if (usernameOrEmail === ADMIN_CONFIG.user && pass === ADMIN_CONFIG.pass) {
      sessionStorage.setItem('bsu_admin', 'true');
      return true;
    }
    return false;
  }
  /* تحويل اسم المستخدم إلى إيميل إذا لم يحتوِ على @ */
  const email = usernameOrEmail.includes('@')
    ? usernameOrEmail
    : `${usernameOrEmail}@specialneed.bsu.edu.eg`;

  const { data, error } = await _sbAdmin.auth.signInWithPassword({ email, password: pass });
  return !error && !!data.session;
}

/* تسجيل الخروج */
async function logout() {
  if (_sbAdmin) await _sbAdmin.auth.signOut();
  sessionStorage.removeItem('bsu_admin');
  window.location.href = 'login.html';
}

/* ============================================
   4. حفظ وقراءة البيانات (localStorage + Supabase)
   ============================================ */
function saveData(key, data) {
  // حفظ فوري في localStorage
  try { localStorage.setItem(`bsu_${key}`, JSON.stringify(data)); } catch (_) {}
  // حفظ في Supabase في الخلفية
  _sbAdminReady.then(() => {
    if (_sbAdmin) {
      _sbAdmin.from('site_data')
        .upsert({ key, value: data, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error('خطأ Supabase save:', key, error);
        });
    }
  });
  return true;
}

function loadData(key) {
  try {
    const item = localStorage.getItem(`bsu_${key}`);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}

function deleteData(key) {
  localStorage.removeItem(`bsu_${key}`);
}

/* ============================================
   5. تحميل البيانات (Supabase + localStorage)
   ============================================ */
async function getData(key) {
  await _sbAdminReady;
  if (_sbAdmin) {
    try {
      const { data, error } = await _sbAdmin
        .from('site_data')
        .select('value')
        .eq('key', key)
        .single();
      if (!error && data && data.value) {
        try { localStorage.setItem(`bsu_${key}`, JSON.stringify(data.value)); } catch (_) {}
        return data.value;
      }
    } catch (_) {}
  }
  // Fallback: localStorage
  const local = loadData(key);
  if (local) return local;
  // Fallback: JSON file
  try {
    const res = await fetch(`${SITE_DATA_PATH}${key}.json`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    saveData(key, data);
    return data;
  } catch (_) {
    console.warn(`تعذر تحميل ${key}`);
    return null;
  }
}

/* حفظ البيانات في localStorage فوراً + Supabase في الخلفية */

/* ============================================
   6. بناء الشريط الجانبي والعلوي
   ============================================ */
function buildLayout(activePage = '') {
  const headerEl  = document.getElementById('admin-header');
  const sidebarEl = document.getElementById('admin-sidebar');
  if (!headerEl || !sidebarEl) return;

  const pages = [
    {
      group: 'الرئيسية',
      items: [
        { id: 'dashboard', label: 'لوحة التحكم', href: 'dashboard.html', icon: iconGrid() }
      ]
    },
    {
      group: 'إدارة المحتوى',
      items: [
        { id: 'staff',    label: 'هيئة التدريس',       href: 'staff.html',    icon: iconUsers() },
        { id: 'news',     label: 'الأخبار',             href: 'news.html',     icon: iconNews() },
        { id: 'events',   label: 'الفعاليات',           href: 'events.html',   icon: iconCalendar() },
        { id: 'projects', label: 'مشاريع التخرج',       href: 'projects.html', icon: iconFile() },
        { id: 'slider',   label: 'صور السلايدر',        href: 'slider.html',   icon: iconImage() }
      ]
    },
    {
      group: 'التواصل والإعدادات',
      items: [
        { id: 'messages', label: 'الرسائل الواردة', href: 'messages.html', icon: iconMail(),     badge: getUnreadCount() },
        { id: 'settings', label: 'الإعدادات',        href: 'settings.html', icon: iconSettings() }
      ]
    }
  ];

  // بناء الشريط الجانبي
  sidebarEl.innerHTML = `
    <div class="sidebar-logo">
      <img src="../assets/images/logo.png"
           alt="لوجو" onerror="this.style.display='none'">
      <div class="sidebar-logo-text">
        <div class="name">لوحة التحكم</div>
        <div class="sub">${ADMIN_CONFIG.siteName}</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${pages.map(group => `
        <div class="nav-group">
          <div class="nav-group-label">${group.group}</div>
          ${group.items.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}">
              <a href="${item.href}">
                ${item.icon}
                <span>${item.label}</span>
                ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
              </a>
            </div>
          `).join('')}
        </div>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <a href="#" onclick="logout(); return false;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>تسجيل الخروج</span>
      </a>
    </div>
  `;

  // بناء الشريط العلوي
  const titles = {
    dashboard: 'لوحة التحكم',
    staff:     'إدارة هيئة التدريس',
    news:      'إدارة الأخبار',
    events:    'إدارة الفعاليات',
    projects:  'إدارة مشاريع التخرج',
    slider:    'إدارة صور السلايدر',
    messages:  'الرسائل الواردة',
    settings:  'الإعدادات'
  };

  headerEl.innerHTML = `
    <div class="topbar">
      <div class="topbar-right">
        <span class="topbar-title">${titles[activePage] || 'لوحة التحكم'}</span>
      </div>
      <div class="topbar-left">
        <a href="../index.html" target="_blank" class="btn btn-ghost btn-sm">
          عرض الموقع
        </a>
        <div class="topbar-user">
          <div class="topbar-avatar">A</div>
          <span>مدير النظام</span>
        </div>
      </div>
    </div>
  `;
}

/* ============================================
   7. عداد الرسائل غير المقروءة
   ============================================ */
function getUnreadCount() {
  const msgs = loadData('contact_messages') || [];
  const count = msgs.filter(m => !m.read).length;
  return count > 0 ? count : null;
}

/* ============================================
   8. Toast (رسائل التنبيه)
   ============================================ */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '&#10003;',
    danger:  '&#10005;',
    warning: '&#9888;'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ============================================
   9. مودال التأكيد (حذف)
   ============================================ */
let confirmCallback = null;

function showConfirm(message, callback) {
  confirmCallback = callback;

  let modal = document.getElementById('confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-body">
          <div class="confirm-modal">
            <div class="confirm-icon confirm-icon-danger">&#128465;</div>
            <div class="confirm-title">تأكيد الحذف</div>
            <div class="confirm-text" id="confirm-text"></div>
            <div class="confirm-actions">
              <button class="btn btn-danger" onclick="doConfirm()">نعم، احذف</button>
              <button class="btn btn-ghost" onclick="closeConfirm()">إلغاء</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('confirm-text').textContent = message;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function doConfirm() {
  closeConfirm();
  if (confirmCallback) confirmCallback();
}

function closeConfirm() {
  const modal = document.getElementById('confirm-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
  confirmCallback = null;
}

/* ============================================
   10. المودال العام
   ============================================ */
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function closeModalOnOverlay(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}

/* ============================================
   11. رفع الصور (Base64)
   ============================================ */
function handleImageUpload(inputEl, previewEl, callback) {
  inputEl.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('الرجاء اختيار ملف صورة صحيح', 'danger');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('حجم الصورة يجب أن لا يتجاوز 5 ميجابايت', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const base64 = e.target.result;
      if (previewEl) {
        previewEl.src = base64;
        previewEl.classList.add('show');
      }
      if (callback) callback(base64, file.name);
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================
   12. رفع ملف PDF
   ============================================ */
function handleFileUpload(inputEl, callback) {
  inputEl.addEventListener('change', function () {
    const file = this.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast('الرجاء اختيار ملف PDF فقط', 'danger');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('حجم الملف يجب أن لا يتجاوز 10 ميجابايت', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      if (callback) callback(e.target.result, file.name);
    };
    reader.readAsDataURL(file);
  });
}

/* ============================================
   13. أدوات مساعدة
   ============================================ */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatDateInput(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
}

function truncate(text, max = 60) {
  if (!text) return '';
  return text.length > max ? text.substring(0, max) + '...' : text;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================
   14. البحث في الجداول
   ============================================ */
function searchTable(inputId, tableBodyId) {
  const input = document.getElementById(inputId);
  const tbody = document.getElementById(tableBodyId);
  if (!input || !tbody) return;

  input.addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();
    const rows  = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

/* ============================================
   15. أيقونات SVG
   ============================================ */
function iconGrid() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>`;
}
function iconUsers() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>`;
}
function iconNews() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/>
    <line x1="18" y1="14" x2="12" y2="14"/>
    <line x1="18" y1="10" x2="12" y2="10"/>
    <line x1="18" y1="18" x2="12" y2="18"/>
  </svg>`;
}
function iconCalendar() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
  </svg>`;
}
function iconFile() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
  </svg>`;
}
function iconImage() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>`;
}
function iconMail() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>`;
}
function iconSettings() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>`;
}
