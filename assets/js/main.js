'use strict';

/* ============================================
   Supabase - تحميل العميل
   ============================================ */
const _BSU_URL = 'https://taplgfctwktiwikiyjhr.supabase.co';
const _BSU_KEY = 'sb_publishable_brFIWbJS5eXa2liIySOxlA_NCrDwFQD';

let _sbClient = null;
const _sbReady = new Promise(resolve => {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  s.onload = () => {
    try {
      _sbClient = window.supabase.createClient(_BSU_URL, _BSU_KEY);
    } catch (_) {}
    resolve();
  };
  s.onerror = () => resolve();
  document.head.appendChild(s);
});

/* ============================================
   getData - جلب البيانات من Supabase أو JSON
   ============================================ */
async function getData(key) {
  await _sbReady;
  if (_sbClient) {
    try {
      const { data, error } = await _sbClient
        .from('site_data')
        .select('value')
        .eq('key', key)
        .single();
      if (!error && data && data.value) return data.value;
    } catch (_) {}
  }
  try {
    const res = await fetch(`data/${key}.json`);
    if (res.ok) return res.json();
  } catch (_) {}
  return null;
}

/* ============================================
   localStorage helpers
   ============================================ */
function getLocal(key) {
  try {
    const item = localStorage.getItem(`bsu_${key}`);
    return item ? JSON.parse(item) : null;
  } catch (_) { return null; }
}

function saveLocal(key, data) {
  try { localStorage.setItem(`bsu_${key}`, JSON.stringify(data)); } catch (_) {}
}

/* ============================================
   أدوات مساعدة
   ============================================ */
function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (_) { return dateStr; }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function showAlert(msg, type) {
  const colors = { error: '#c0392b', success: '#27ae60', warning: '#e67e22' };
  const color  = colors[type] || colors.error;

  let box = document.getElementById('_bsu_alert');
  if (!box) {
    box = document.createElement('div');
    box.id = '_bsu_alert';
    box.style.cssText = [
      'position:fixed', 'top:20px', 'right:20px', 'z-index:9999',
      'padding:12px 20px', 'border-radius:6px', 'font-family:Cairo,Tahoma,Arial,sans-serif',
      'font-size:14px', 'font-weight:700', 'color:#fff', 'box-shadow:0 4px 16px rgba(0,0,0,0.2)',
      'transition:all 0.3s ease', 'max-width:320px', 'direction:rtl'
    ].join(';');
    document.body.appendChild(box);
  }

  box.textContent   = msg;
  box.style.background = color;
  box.style.opacity = '1';
  box.style.display = 'block';

  clearTimeout(box._timer);
  box._timer = setTimeout(() => {
    box.style.opacity = '0';
    setTimeout(() => { box.style.display = 'none'; }, 300);
  }, 3500);
}

/* ============================================
   إرسال رسالة التواصل إلى Supabase
   ============================================ */
async function submitContactToSupabase(formData) {
  await _sbReady;
  if (!_sbClient) return false;
  try {
    const { error } = await _sbClient
      .from('contact_messages')
      .insert([{
        id:         generateId(),
        name:       formData.name,
        email:      formData.email,
        phone:      formData.phone || '',
        subject:    formData.subject || '',
        title:      formData.title  || '',
        message:    formData.message,
        read:       false,
        created_at: new Date().toISOString()
      }]);
    return !error;
  } catch (_) { return false; }
}

/* ============================================
   السلايدر
   ============================================ */
let _slides    = [];
let _slideIdx  = 0;
let _slideTimer = null;

function initSlider(slides) {
  _slides = slides || [];
  if (!_slides.length) return;

  const container = document.getElementById('slider-container');
  const dotsEl    = document.getElementById('slider-dots');
  if (!container) return;

  container.innerHTML = _slides.map((s, i) => `
    <div class="slide${i === 0 ? ' active' : ''}">
      <div class="slide-img" style="background-image:url('${s.image || ''}')"></div>
      <div class="slide-overlay"></div>
      <div class="container">
        <div class="slide-content">
          <h2>${escHtml(s.title || '')}</h2>
          ${s.subtitle ? `<p>${escHtml(s.subtitle)}</p>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  if (dotsEl) {
    dotsEl.innerHTML = _slides.map((_, i) =>
      `<button class="dot${i === 0 ? ' active' : ''}" onclick="goToSlide(${i})"></button>`
    ).join('');
  }

  startSliderTimer();
}

function goToSlide(idx) {
  const slideEls = document.querySelectorAll('.slide');
  const dotEls   = document.querySelectorAll('.dot');
  if (!slideEls.length) return;
  slideEls[_slideIdx]?.classList.remove('active');
  dotEls[_slideIdx]?.classList.remove('active');
  _slideIdx = ((idx % _slides.length) + _slides.length) % _slides.length;
  slideEls[_slideIdx]?.classList.add('active');
  dotEls[_slideIdx]?.classList.add('active');
}

function nextSlide() { goToSlide(_slideIdx + 1); }
function prevSlide()  { goToSlide(_slideIdx - 1); }

function startSliderTimer() {
  stopSliderTimer();
  if (_slides.length > 1) _slideTimer = setInterval(nextSlide, 5000);
}

function stopSliderTimer() {
  if (_slideTimer) { clearInterval(_slideTimer); _slideTimer = null; }
}

/* ============================================
   escapeHtml (للحماية من XSS)
   ============================================ */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================
   initPage - الهيدر والفوتر
   ============================================ */
function initPage(activePage) {
  _buildHeader(activePage);
  _buildFooter();
}

function _buildHeader(activePage) {
  const el = document.getElementById('site-header');
  if (!el) return;

  const navItems = [
    { id: 'index',    label: 'الرئيسية',          href: 'index.html' },
    { id: 'about',    label: 'عن الكلية',          href: 'about.html' },
    { id: 'staff',    label: 'هيئة التدريس',        href: 'staff.html' },
    { id: 'news',     label: 'الأخبار والفعاليات',  href: 'news.html' },
    { id: 'projects', label: 'مشاريع التخرج',        href: 'projects.html' },
    { id: 'contact',  label: 'اتصل بنا',            href: 'contact.html' }
  ];

  el.innerHTML = `
    <div class="topbar">
      <div class="container">
        <div class="topbar-right">
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            الأحد - الخميس: 9:00 ص - 3:00 م
          </span>
        </div>
        <div class="topbar-left">
          <a href="https://www.bsu.edu.eg" target="_blank">جامعة بني سويف</a>
          <a href="http://www.results.bsu.edu.eg" target="_blank">نتائج الطلاب</a>
          <a href="admin/login.html">لوحة التحكم</a>
        </div>
      </div>
    </div>
    <header class="header">
      <div class="container">
        <a href="index.html" class="header-logo">
          <img src="assets/images/logo.png" alt="شعار الكلية" onerror="this.style.display='none'">
          <div class="header-logo-text">
            <div class="univ-name">جامعة بني سويف</div>
            <div class="faculty-name">كلية علوم ذوي الاحتياجات الخاصة</div>
            <div class="faculty-name-en">Faculty of Special Needs Sciences · BSU</div>
          </div>
        </a>
        <div class="header-actions">
          <a href="contact.html" class="btn btn-primary" style="font-size:13px;padding:7px 16px;">تواصل معنا</a>
        </div>
      </div>
    </header>
    <nav class="navbar">
      <div class="container">
        <ul class="nav-list">
          ${navItems.map(n => `
            <li class="${activePage === n.id ? 'active' : ''}">
              <a href="${n.href}">${n.label}</a>
            </li>
          `).join('')}
        </ul>
      </div>
    </nav>
  `;
}

function _buildFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;

  el.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <h3>كلية علوم ذوي الاحتياجات الخاصة</h3>
            <p>كلية متخصصة في تعليم وتأهيل ذوي الاحتياجات الخاصة بجامعة بني سويف، تسعى إلى تقديم تعليم متميز وبحث علمي رائد في خدمة هذه الفئة الكريمة من أبناء مجتمعنا.</p>
            <p>بني سويف، جمهورية مصر العربية</p>
          </div>
          <div class="footer-col">
            <h3>روابط سريعة</h3>
            <a href="index.html">الرئيسية</a>
            <a href="about.html">عن الكلية</a>
            <a href="staff.html">هيئة التدريس</a>
            <a href="news.html">الأخبار والفعاليات</a>
            <a href="projects.html">مشاريع التخرج</a>
            <a href="contact.html">اتصل بنا</a>
          </div>
          <div class="footer-col">
            <h3>خدمات الطلاب</h3>
            <a href="http://www.results.bsu.edu.eg" target="_blank">نتائج الطلاب</a>
            <a href="http://www.email.bsu.edu.eg/_BSU_Std.aspx" target="_blank">البريد الجامعي</a>
            <a href="http://www.digitalibrary.bsu.edu.eg" target="_blank">المكتبة الرقمية</a>
            <a href="https://www.bsu.edu.eg" target="_blank">بوابة الجامعة</a>
          </div>
          <div class="footer-col">
            <h3>تواصل معنا</h3>
            <a href="tel:082XXXXXXX">هاتف: 082-XXXXXXX</a>
            <a href="mailto:info@specialneed.bsu.edu.eg">info@specialneed.bsu.edu.eg</a>
            <a href="contact.html">نموذج التواصل</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container" style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
          <span>© ${new Date().getFullYear()} كلية علوم ذوي الاحتياجات الخاصة - جامعة بني سويف. جميع الحقوق محفوظة.</span>
          <a href="admin/login.html" style="color:rgba(255,255,255,0.35);font-size:11px;">لوحة التحكم</a>
        </div>
      </div>
    </footer>
  `;
}
