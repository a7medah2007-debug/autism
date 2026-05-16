'use strict';

/* ============================================
   Supabase — تحميل ديناميكي + تهيئة العميل
   ============================================ */
const _SB_URL      = 'https://taplgfctwktiwikiyjhr.supabase.co';
const _SB_ANON_KEY = 'sb_publishable_brFIWbJS5eXa2liIySOxlA_NCrDwFQD';
const _IK_ENDPOINT = 'https://ik.imagekit.io/autism';

let _sbClient = null;

function _initSb() {
  if (_sbClient) return Promise.resolve(_sbClient);
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      _sbClient = window.supabase.createClient(_SB_URL, _SB_ANON_KEY);
      return resolve(_sbClient);
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    s.onload = () => {
      _sbClient = window.supabase.createClient(_SB_URL, _SB_ANON_KEY);
      resolve(_sbClient);
    };
    s.onerror = () => reject(new Error('Failed to load Supabase SDK'));
    document.head.appendChild(s);
  });
}

/* ============================================
   ImageKit URL helper
   ============================================ */
function ikUrl(path, transforms) {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:')) return path;
  // Direct ImageKit URL — insert transform segment when requested
  if (path.startsWith(_IK_ENDPOINT + '/')) {
    if (transforms) {
      return path.replace(_IK_ENDPOINT + '/', _IK_ENDPOINT + '/tr:' + transforms + '/');
    }
    return path;
  }
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return path;
  }
  // Relative path — serve via ImageKit endpoint
  const tr = transforms ? 'tr:' + transforms + '/' : '';
  return `${_IK_ENDPOINT}/${tr}${path.replace(/^\//, '')}`;
}

/* ============================================
   getData — قراءة من Supabase مع JSON احتياطي
   ============================================ */
async function getData(key) {
  try {
    const db = await _initSb();
    const data = await _getFromSupabase(db, key);
    if (data !== null) return data;
  } catch (e) {
    console.warn('[getData] Supabase error for', key, e);
  }
  // Fallback to local JSON files
  try {
    const res = await fetch('data/' + key + '.json');
    if (res.ok) return res.json();
  } catch (_) {}
  return null;
}

async function _getFromSupabase(db, key) {
  switch (key) {
    case 'news': {
      const [{ data: news, error: e1 }, { data: cats, error: e2 }] = await Promise.all([
        db.from('news').select('*').eq('published', true).order('created_at', { ascending: false }),
        db.from('news_categories').select('*').order('name')
      ]);
      if (e1) throw e1;
      return { news: news || [], categories: (cats || []).map(c => c.name) };
    }

    case 'events': {
      const { data, error } = await db.from('events').select('*')
        .eq('published', true).order('date', { ascending: false });
      if (error) throw error;
      return { events: data || [] };
    }

    case 'projects': {
      const { data, error } = await db.from('projects').select('*')
        .eq('published', true).order('created_at', { ascending: false });
      if (error) throw error;
      return { projects: data || [] };
    }

    case 'staff': {
      const { data, error } = await db.from('staff').select('*')
        .eq('published', true).order('sort_order').order('created_at');
      if (error) throw error;
      const rows = data || [];
      // Return in the legacy format expected by staff.html and index.html
      return {
        department_head:       rows.filter(r => r.role === 'head'),
        professors:            rows.filter(r => r.role === 'professor'),
        associate_professors:  rows.filter(r => r.role === 'associate_professor'),
        lecturers:             rows.filter(r => r.role === 'lecturer'),
        assistants:            rows.filter(r => r.role === 'assistant'),
        students:              rows.filter(r => r.role === 'student')
      };
    }

    case 'slider': {
      const { data, error } = await db.from('slider').select('*')
        .eq('published', true).order('sort_order').order('created_at');
      if (error) throw error;
      return { slides: data || [] };
    }

    case 'site_settings': {
      const { data, error } = await db.from('site_settings').select('*');
      if (error) throw error;
      // Merge all key/value rows into a flat object
      const settings = {};
      for (const row of (data || [])) {
        const val = row.value;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          Object.assign(settings, val);
        } else {
          settings[row.key] = val;
        }
      }
      return Object.keys(settings).length ? settings : null;
    }

    case 'contact_info': {
      // Legacy: read from existing contact_info table
      const { data, error } = await db.from('contact_info').select('*').limit(1).single();
      if (error) return null;
      return data;
    }

    default:
      return null;
  }
}

/* ============================================
   إعدادات الموقع — كاش لتسريع العرض
   ============================================ */
let _siteSettingsPromise = null;
function getSiteSettings() {
  if (!_siteSettingsPromise) {
    _siteSettingsPromise = getData('site_settings').then(s => s || {});
  }
  return _siteSettingsPromise;
}

/* ============================================
   مساعدات الصور
   ============================================ */
function resolveImg(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('//') || url.startsWith('blob:')) return url;
  return 'assets/images/' + url;
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

function escHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showAlert(msg, type) {
  const colors = { error: '#c0392b', success: '#27ae60', warning: '#e67e22' };
  const color  = colors[type] || colors.error;
  let box = document.getElementById('_bsu_alert');
  if (!box) {
    box = document.createElement('div');
    box.id = '_bsu_alert';
    box.style.cssText = [
      'position:fixed','top:20px','right:20px','z-index:9999',
      'padding:12px 20px','border-radius:6px',
      'font-family:Cairo,Tahoma,Arial,sans-serif',
      'font-size:14px','font-weight:700','color:#fff',
      'box-shadow:0 4px 16px rgba(0,0,0,0.2)',
      'transition:all 0.3s ease','max-width:320px','direction:rtl'
    ].join(';');
    document.body.appendChild(box);
  }
  box.textContent      = msg;
  box.style.background = color;
  box.style.opacity    = '1';
  box.style.display    = 'block';
  clearTimeout(box._timer);
  box._timer = setTimeout(() => {
    box.style.opacity = '0';
    setTimeout(() => { box.style.display = 'none'; }, 300);
  }, 3500);
}

/* ============================================
   السلايدر
   ============================================ */
let _slides     = [];
let _slideIdx   = 0;
let _slideTimer = null;

function initSlider(slides) {
  _slides = slides || [];
  if (!_slides.length) return;

  const container = document.getElementById('slider-container');
  const dotsEl    = document.getElementById('slider-dots');
  if (!container) return;

  container.innerHTML = _slides.map((s, i) => `
    <div class="slide${i === 0 ? ' active' : ''}">
      <div class="slide-img" style="background-image:url('${resolveImg(s.image || '')}')"></div>
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
   الهيدر والفوتر
   ============================================ */
async function initPage(activePage) {
  const settings = await getSiteSettings();
  _buildHeader(activePage, settings);
  _buildFooter(settings);
}

function _buildHeader(activePage, settings) {
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

  const univName    = settings.univ_name    || 'جامعة بني سويف';
  const facName     = settings.faculty_name || 'كلية علوم ذوي الاحتياجات الخاصة';
  const facNameEn   = settings.faculty_name_en
    ? settings.faculty_name_en + ' · BSU'
    : 'Faculty of Special Needs Sciences · BSU';
  const hoursTxt    = _getOpenHoursText(settings.hours);
  const resultsLink = settings.link_results || 'http://www.results.bsu.edu.eg';
  const univLink    = settings.link_univ    || 'https://www.bsu.edu.eg';
  const logoSrc     = settings.logo || 'assets/images/logo.png';

  el.innerHTML = `
    <div class="topbar">
      <div class="container">
        <div class="topbar-right">
          <span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            ${escHtml(hoursTxt)}
          </span>
        </div>
        <div class="topbar-left">
          <a href="${escHtml(univLink)}" target="_blank">${escHtml(univName)}</a>
          <a href="${escHtml(resultsLink)}" target="_blank">نتائج الطلاب</a>
        </div>
      </div>
    </div>
    <header class="header">
      <div class="container">
        <a href="index.html" class="header-logo">
          <img src="${escHtml(logoSrc)}" alt="شعار الكلية" onerror="this.style.display='none'">
          <div class="header-logo-text">
            <div class="univ-name">${escHtml(univName)}</div>
            <div class="faculty-name">${escHtml(facName)}</div>
            <div class="faculty-name-en">${escHtml(facNameEn)}</div>
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

function _getOpenHoursText(hours) {
  if (!hours) return 'الأحد - الخميس: 9:00 ص - 3:00 م';
  const order = ['sun','mon','tue','wed','thu','fri','sat'];
  const names = { sun:'الأحد', mon:'الاثنين', tue:'الثلاثاء', wed:'الأربعاء',
                  thu:'الخميس', fri:'الجمعة', sat:'السبت' };
  const open  = order.filter(d => hours[d] && !hours[d].closed);
  if (!open.length) return 'مغلق';
  const first = open[0], last = open[open.length - 1];
  const f = hours[first].from || '09:00';
  const t = hours[first].to   || '15:00';
  if (first === last) return `${names[first]}: ${f} - ${t}`;
  return `${names[first]} - ${names[last]}: ${f} - ${t}`;
}

function _buildFooter(settings) {
  const el = document.getElementById('site-footer');
  if (!el) return;

  const facName       = settings.faculty_name || 'كلية علوم ذوي الاحتياجات الخاصة';
  const footerAbout   = settings.footer_about || 'كلية متخصصة في تعليم وتأهيل ذوي الاحتياجات الخاصة بجامعة بني سويف، تسعى إلى تقديم تعليم متميز وبحث علمي رائد في خدمة هذه الفئة الكريمة من أبناء مجتمعنا.';
  const address       = settings.address || 'بني سويف، جمهورية مصر العربية';
  const phone         = settings.phone   || '082-XXXXXXX';
  const email         = settings.email   || 'info@specialneed.bsu.edu.eg';
  const copyright     = settings.copyright
    ? settings.copyright
    : `© ${new Date().getFullYear()} ${facName} - جامعة بني سويف. جميع الحقوق محفوظة.`;
  const linkResults   = settings.link_results || 'http://www.results.bsu.edu.eg';
  const linkEmail     = settings.link_email   || 'http://www.email.bsu.edu.eg/_BSU_Std.aspx';
  const linkLibrary   = settings.link_library || 'http://www.digitalibrary.bsu.edu.eg';
  const linkUniv      = settings.link_univ    || 'https://www.bsu.edu.eg';

  el.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <h3>${escHtml(facName)}</h3>
            <p>${escHtml(footerAbout)}</p>
            <p>${escHtml(address)}</p>
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
            <a href="${escHtml(linkResults)}" target="_blank">نتائج الطلاب</a>
            <a href="${escHtml(linkEmail)}" target="_blank">البريد الجامعي</a>
            <a href="${escHtml(linkLibrary)}" target="_blank">المكتبة الرقمية</a>
            <a href="${escHtml(linkUniv)}" target="_blank">بوابة الجامعة</a>
          </div>
          <div class="footer-col">
            <h3>تواصل معنا</h3>
            <a href="tel:${escHtml(phone.replace(/[^0-9+]/g,''))}">هاتف: ${escHtml(phone)}</a>
            <a href="mailto:${escHtml(email)}">${escHtml(email)}</a>
            <a href="contact.html">نموذج التواصل</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="container" style="display:flex;justify-content:space-between;align-items:center;width:100%;flex-wrap:wrap;gap:8px;">
          <span>${escHtml(copyright)}</span>
        </div>
      </div>
    </footer>
  `;
}
