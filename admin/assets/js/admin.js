'use strict';
/* ══════════════════════════════════════════════════════════
   لوحة تحكم — كلية علوم ذوي الاحتياجات الخاصة
   Backend: Supabase (service role key — bypasses RLS)
   ══════════════════════════════════════════════════════════ */

/* ── 1. إعدادات Supabase ─────────────────────────────── */
const _SB_URL      = 'https://taplgfctwktiwikiyjhr.supabase.co';
const _SB_SVC_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcGxnZmN0d2t0aXdpa2l5amhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE4MjQ5NiwiZXhwIjoyMDkzNzU4NDk2fQ.t0UGyub-2acXX-jlXwSGjGbX4f9kV8Fk2aSAIW3_TTo';
const _IK_ENDPOINT    = 'https://ik.imagekit.io/autism';
const _IK_PRIVATE_KEY = 'private_AXgco1S6rygOVwrSdEmP4Pr2VW8=';

const ADMIN_CONFIG = {
  user:     'dr-ahmed',
  pass:     'autism@2026',
  siteName: 'كلية علوم ذوي الاحتياجات الخاصة',
  version:  '2.0.0'
};

let _sbAdmin = null;

function _initSbAdmin() {
  if (_sbAdmin) return Promise.resolve(_sbAdmin);
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      _sbAdmin = window.supabase.createClient(_SB_URL, _SB_SVC_KEY, {
        auth: { persistSession: false }
      });
      return resolve(_sbAdmin);
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    s.onload = () => {
      _sbAdmin = window.supabase.createClient(_SB_URL, _SB_SVC_KEY, {
        auth: { persistSession: false }
      });
      resolve(_sbAdmin);
    };
    s.onerror = () => reject(new Error('Failed to load Supabase SDK'));
    document.head.appendChild(s);
  });
}

/* ── 2. حماية الصفحة ─────────────────────────────────── */
const _onLogin = window.location.pathname.includes('login');
if (!_onLogin) document.documentElement.style.visibility = 'hidden';

(function checkPageAuth() {
  const ok = !!sessionStorage.getItem('bsu_admin_ok');
  if (_onLogin) {
    if (ok) window.location.href = 'dashboard.html';
    document.documentElement.style.visibility = 'visible';
  } else {
    if (!ok) { window.location.href = 'login.html'; return; }
    document.documentElement.style.visibility = 'visible';
  }
})();

/* ── 3. تسجيل الدخول / الخروج ───────────────────────── */
function checkAuth() {
  // Auth is enforced by the checkPageAuth IIFE at script load; this is a safe no-op.
}

function login(user, pass) {
  if (user === ADMIN_CONFIG.user && pass === ADMIN_CONFIG.pass) {
    sessionStorage.setItem('bsu_admin_ok', '1');
    return Promise.resolve(true);
  }
  return Promise.resolve(false);
}

function logout() {
  sessionStorage.removeItem('bsu_admin_ok');
  window.location.href = 'login.html';
}

/* ── 4. قراءة البيانات من Supabase ──────────────────── */
async function getData(key) {
  try {
    const db = await _initSbAdmin();
    const data = await _getFromSupabase(db, key);
    if (data !== null) return data;
  } catch (e) {
    console.warn('[admin getData] Supabase error for', key, e);
  }
  // Fallback to local JSON
  try {
    const res = await fetch('../data/' + key + '.json');
    if (res.ok) return res.json();
  } catch (_) {}
  return null;
}

async function _getFromSupabase(db, key) {
  switch (key) {
    case 'news': {
      const [{ data: news, error: e1 }, { data: cats }] = await Promise.all([
        db.from('news').select('*').order('created_at', { ascending: false }),
        db.from('news_categories').select('*').order('name')
      ]);
      if (e1) throw e1;
      return { news: news || [], categories: (cats || []).map(c => c.name) };
    }

    case 'events': {
      const { data, error } = await db.from('events').select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      return { events: data || [] };
    }

    case 'projects': {
      const { data, error } = await db.from('projects').select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { projects: data || [] };
    }

    case 'staff': {
      const { data, error } = await db.from('staff').select('*')
        .order('sort_order').order('created_at');
      if (error) throw error;
      const rows = data || [];
      return {
        department_head:      rows.filter(r => r.role === 'head'),
        professors:           rows.filter(r => r.role === 'professor'),
        associate_professors: rows.filter(r => r.role === 'associate_professor'),
        lecturers:            rows.filter(r => r.role === 'lecturer'),
        assistants:           rows.filter(r => r.role === 'assistant'),
        students:             rows.filter(r => r.role === 'student')
      };
    }

    case 'slider': {
      const { data, error } = await db.from('slider').select('*')
        .order('sort_order').order('created_at');
      if (error) throw error;
      return { slides: data || [] };
    }

    case 'site_settings': {
      const { data, error } = await db.from('site_settings').select('*');
      if (error) throw error;
      const settings = {};
      for (const row of (data || [])) {
        const val = row.value;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          Object.assign(settings, val);
        } else {
          settings[row.key] = val;
        }
      }
      return Object.keys(settings).length ? settings : {};
    }

    default:
      return null;
  }
}

/* ── 5. حفظ البيانات في Supabase (UPSERT strategy) ──── */
async function saveData(key, value) {
  try {
    const db = await _initSbAdmin();
    await _saveToSupabase(db, key, value);
    return true;
  } catch (e) {
    console.error('[saveData]', key, e);
    showToast('حدث خطأ أثناء الحفظ: ' + (e.message || e), 'danger');
    return false;
  }
}

async function _saveToSupabase(db, key, value) {
  switch (key) {
    case 'news': {
      const { news = [], categories = [] } = value;
      await _upsertRows(db, 'news', news);
      // Sync categories
      if (categories.length) {
        await db.from('news_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const catRows = categories.map(name => ({ name }));
        const { error } = await db.from('news_categories').upsert(catRows, { onConflict: 'name' });
        if (error) throw error;
      }
      break;
    }

    case 'events': {
      const { events = [] } = value;
      await _upsertRows(db, 'events', events);
      break;
    }

    case 'projects': {
      const { projects = [] } = value;
      await _upsertRows(db, 'projects', projects);
      break;
    }

    case 'slider': {
      const { slides = [] } = value;
      await _upsertRows(db, 'slider', slides);
      break;
    }

    case 'site_settings': {
      // Save everything as a single 'general' row in site_settings
      const { error } = await db.from('site_settings').upsert({
        key: 'general',
        value: value
      }, { onConflict: 'key' });
      if (error) throw error;
      break;
    }

    default:
      throw new Error('Unknown data key: ' + key);
  }
}

async function _upsertRows(db, table, rows) {
  if (!rows || !rows.length) {
    // Delete all rows when array is empty
    await db.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    return;
  }

  // Fetch existing IDs to find which rows were deleted
  const { data: existing } = await db.from(table).select('id');
  const existingIds = new Set((existing || []).map(r => r.id));

  // Rows without a valid UUID ID are new — they might have local generateId() values
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const rowsToUpsert = rows.map(r => {
    const clean = { ...r };
    if (!clean.id || !UUID_RE.test(clean.id)) {
      delete clean.id; // Let Supabase auto-generate UUID
    }
    return clean;
  });

  // IDs in current rows that are valid UUIDs (i.e., already in DB)
  const keepIds = new Set(rows.filter(r => r.id && UUID_RE.test(r.id)).map(r => r.id));

  // Delete rows removed by the user
  const toDelete = [...existingIds].filter(id => !keepIds.has(id));
  if (toDelete.length) {
    const { error } = await db.from(table).delete().in('id', toDelete);
    if (error) throw error;
  }

  // Upsert all current rows
  const { error } = await db.from(table).upsert(rowsToUpsert);
  if (error) throw error;
}

/* ── 6. رفع الملفات إلى ImageKit ────────────────────── */
async function _ikUpload(file, folder) {
  const ext      = file.name.split('.').pop() || 'bin';
  const fileName = Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', fileName);
  formData.append('useUniqueFileName', 'false');
  formData.append('folder', folder || '/uploads');

  const auth = btoa(_IK_PRIVATE_KEY + ':');
  const res  = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + auth },
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'ImageKit upload failed (' + res.status + ')');
  }
  const result = await res.json();
  return result.url;
}

async function uploadImage(file) {
  return _ikUpload(file, '/uploads');
}

function handleImageUpload(inputEl, previewEl, callback) {
  if (!inputEl) return;
  inputEl.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('الرجاء اختيار ملف صورة صحيح', 'danger');
      this.value = '';
      return;
    }
    // Show base64 preview immediately so the UI feels instant
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      if (previewEl) { previewEl.src = base64; previewEl.classList.add('show'); }
      if (callback) callback(base64, file.name, null);
      // Upload to ImageKit in the background then swap in the real URL
      try {
        showToast('جارٍ رفع الصورة إلى ImageKit…', 'success');
        const url = await uploadImage(file);
        if (previewEl) previewEl.src = url;
        if (callback) callback(url, file.name, url);
        showToast('تم رفع الصورة بنجاح', 'success');
      } catch (err) {
        console.error('ImageKit image upload failed', err);
        showToast('فشل رفع الصورة: ' + err.message, 'danger');
      }
    };
    reader.readAsDataURL(file);
    this.value = '';
  });
}

function handleFileUpload(inputEl, callback) {
  if (!inputEl) return;
  inputEl.addEventListener('change', async function () {
    const file = this.files[0];
    if (!file) return;
    try {
      showToast('جارٍ رفع الملف إلى ImageKit…', 'success');
      const url = await _ikUpload(file, '/files');
      if (callback) callback(url, file.name);
      showToast('تم رفع الملف بنجاح', 'success');
    } catch (err) {
      console.error('ImageKit file upload failed', err);
      showToast('فشل رفع الملف: ' + err.message, 'danger');
    }
    this.value = '';
  });
}

/* ── 7. مساعدات الصور ───────────────────────────────── */
function _resolveImg(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('//') || url.startsWith('blob:')) return url;
  return '../assets/images/' + url;
}

function _ikUrl(url, transforms) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  // Direct ImageKit URL — insert transform segment when requested
  if (url.startsWith(_IK_ENDPOINT + '/')) {
    if (transforms) {
      return url.replace(_IK_ENDPOINT + '/', _IK_ENDPOINT + '/tr:' + transforms + '/');
    }
    return url;
  }
  return _resolveImg(url);
}

/* ── 8. عدد الرسائل غير المقروءة ────────────────────── */
async function _getUnreadCount() {
  try {
    const db = await _initSbAdmin();
    const { count } = await db.from('messages').select('id', { count: 'exact', head: true })
      .eq('is_read', false);
    return count || 0;
  } catch (_) {
    return 0;
  }
}

/* ── 9. بناء الواجهة (شريط جانبي + علوي) ──────────── */
async function buildLayout(activePage) {
  activePage = activePage || '';
  const headerEl  = document.getElementById('admin-header');
  const sidebarEl = document.getElementById('admin-sidebar');
  if (!headerEl || !sidebarEl) return;

  const unreadCount = await _getUnreadCount();
  const unreadBadge = unreadCount > 0
    ? `<span class="badge badge-danger" style="margin-right:4px">${unreadCount}</span>`
    : '';

  const pages = [
    { group: 'الرئيسية', items: [
      { id: 'dashboard', label: 'لوحة التحكم',    href: 'dashboard.html', icon: iconGrid() }
    ]},
    { group: 'إدارة المحتوى', items: [
      { id: 'staff',    label: 'هيئة التدريس',    href: 'staff.html',    icon: iconUsers() },
      { id: 'news',     label: 'الأخبار',          href: 'news.html',     icon: iconNews() },
      { id: 'events',   label: 'الفعاليات',        href: 'events.html',   icon: iconCalendar() },
      { id: 'projects', label: 'مشاريع التخرج',    href: 'projects.html', icon: iconFile() },
      { id: 'slider',   label: 'صور السلايدر',     href: 'slider.html',   icon: iconImage() },
      { id: 'messages', label: 'الرسائل' + unreadBadge, href: 'messages.html', icon: iconMail() }
    ]},
    { group: 'الإعدادات', items: [
      { id: 'settings', label: 'الإعدادات',        href: 'settings.html', icon: iconSettings() }
    ]}
  ];

  sidebarEl.innerHTML = `
    <div class="sidebar-logo">
      <img src="../assets/images/logo.png" alt="لوجو" onerror="this.style.display='none'">
      <div class="sidebar-logo-text">
        <div class="name">لوحة التحكم</div>
        <div class="sub">${ADMIN_CONFIG.siteName}</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      ${pages.map(g => `
        <div class="nav-group">
          <div class="nav-group-label">${g.group}</div>
          ${g.items.map(item => `
            <div class="nav-item ${activePage === item.id ? 'active' : ''}">
              <a href="${item.href}">
                ${item.icon}<span>${item.label}</span>
              </a>
            </div>`).join('')}
        </div>`).join('')}
    </nav>
    <div class="sidebar-footer">
      <a href="#" onclick="logout();return false;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>تسجيل الخروج</span>
      </a>
    </div>`;

  const titles = {
    dashboard: 'لوحة التحكم', staff: 'هيئة التدريس', news: 'الأخبار',
    events: 'الفعاليات', projects: 'مشاريع التخرج',
    slider: 'صور السلايدر', messages: 'الرسائل', settings: 'الإعدادات'
  };

  headerEl.innerHTML = `
    <div class="topbar">
      <div class="topbar-right">
        <span class="topbar-title">${titles[activePage] || 'لوحة التحكم'}</span>
      </div>
      <div class="topbar-left">
        <a href="../index.html" target="_blank" class="btn btn-ghost btn-sm">عرض الموقع</a>
        <div class="topbar-user">
          <div class="topbar-avatar">A</div>
          <span>مدير النظام</span>
        </div>
      </div>
    </div>`;
}

/* ── 10. Toast ────────────────────────────────────────── */
function showToast(message, type) {
  type = type || 'success';
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', danger: '✕', warning: '⚠' };
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML = '<span>' + (icons[type] || '') + '</span> ' + message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ── 11. مودال التأكيد ───────────────────────────────── */
let _confirmCb = null;

function showConfirm(message, callback) {
  _confirmCb = callback;
  let modal = document.getElementById('confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal modal-sm">
        <div class="modal-body">
          <div class="confirm-modal">
            <div class="confirm-icon confirm-icon-danger">🗑</div>
            <div class="confirm-title">تأكيد</div>
            <div class="confirm-text" id="confirm-text"></div>
            <div class="confirm-actions">
              <button class="btn btn-danger" onclick="doConfirm()">تأكيد</button>
              <button class="btn btn-ghost" onclick="closeConfirm()">إلغاء</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  document.getElementById('confirm-text').textContent = message;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function doConfirm()  { closeConfirm(); if (_confirmCb) _confirmCb(); }
function closeConfirm() {
  const m = document.getElementById('confirm-modal');
  if (m) m.classList.remove('open');
  document.body.style.overflow = '';
  _confirmCb = null;
}

/* ── 12. المودال العام ───────────────────────────────── */
function openModal(id)  { const m = document.getElementById(id); if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; } }
function closeModal(id) { const m = document.getElementById(id); if (m) { m.classList.remove('open'); document.body.style.overflow = ''; } }
function closeModalOnOverlay(e, id) { if (e.target === document.getElementById(id)) closeModal(id); }

/* ── 13. البحث في الجداول ───────────────────────────── */
function searchTable(inputId, tableBodyId) {
  const input = document.getElementById(inputId);
  const tbody = document.getElementById(tableBodyId);
  if (!input || !tbody) return;
  input.addEventListener('input', function () {
    const q = this.value.trim().toLowerCase();
    tbody.querySelectorAll('tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

/* ── 14. أدوات مساعدة ───────────────────────────────── */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (_) { return dateStr; }
}

function formatDateInput(dateStr) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toISOString().split('T')[0]; } catch (_) { return ''; }
}

function truncate(text, max) {
  max = max || 60;
  if (!text) return '';
  return text.length > max ? text.substring(0, max) + '…' : text;
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── 15. أيقونات SVG ────────────────────────────────── */
function iconGrid()     { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'; }
function iconUsers()    { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>'; }
function iconNews()     { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2"/><line x1="18" y1="14" x2="12" y2="14"/><line x1="18" y1="10" x2="12" y2="10"/><line x1="18" y1="18" x2="12" y2="18"/></svg>'; }
function iconCalendar() { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'; }
function iconFile()     { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>'; }
function iconImage()    { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'; }
function iconSettings() { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>'; }
function iconMail()     { return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'; }
