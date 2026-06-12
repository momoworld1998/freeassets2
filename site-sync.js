// ============================================================
// site-sync.js — Makes Admin Panel changes appear LIVE on site
// Load this AFTER data.js and BEFORE main.js / page scripts.
// All admin edits are stored in localStorage (shared across
// pages on the same domain) and applied here on every page load.
// ============================================================

(function () {
  // ---- 1. Override ASSETS / CATEGORIES / MUSIC_SAMPLES (only if data.js is loaded) ----
  try {
    const savedAssets = localStorage.getItem('adminAssets');
    const savedCats   = localStorage.getItem('adminCats');
    const savedMusic  = localStorage.getItem('adminMusic');

    if (savedAssets && window.ASSETS) {
      const parsed = JSON.parse(savedAssets);
      const live = parsed.filter(a => a.published !== false);
      window.ASSETS.length = 0;
      live.forEach(a => window.ASSETS.push(a));
    }
    if (savedCats && window.CATEGORIES) {
      const parsed = JSON.parse(savedCats);
      window.CATEGORIES.length = 0;
      parsed.forEach(c => window.CATEGORIES.push(c));
    }
    if (savedMusic && window.MUSIC_SAMPLES) {
      const parsed = JSON.parse(savedMusic);
      window.MUSIC_SAMPLES.length = 0;
      parsed.forEach(m => window.MUSIC_SAMPLES.push(m));
    }

    const settings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
    if (settings.trendingKeywords && window.TRENDING_SEARCHES) {
      const kws = settings.trendingKeywords.split(',').map(s => s.trim()).filter(Boolean);
      if (kws.length) {
        window.TRENDING_SEARCHES.length = 0;
        kws.forEach(k => window.TRENDING_SEARCHES.push(k));
      }
    }
  } catch (e) {
    console.warn('site-sync: data override failed', e);
  }

  // ---- 2. Apply settings once DOM is ready (works on every page) ----
  document.addEventListener('DOMContentLoaded', () => {
    let settings = {};
    try { settings = JSON.parse(localStorage.getItem('adminSettings') || '{}'); } catch (e) {}

    try { applyHeroSettings(settings); } catch (e) { console.warn('site-sync: hero', e); }
    try { applyContactInfo(settings); } catch (e) { console.warn('site-sync: contact', e); }
    try { applyAdSenseConfig(settings); } catch (e) { console.warn('site-sync: ads', e); }
    try { applySectionVisibility(); } catch (e) { console.warn('site-sync: sections', e); }
    try { applyAnnouncementBar(settings); } catch (e) { console.warn('site-sync: announcement', e); }
  });

  // ---- HERO SECTION ----
  function applyHeroSettings(settings) {
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
    const setPh = (id, val) => { const el = document.getElementById(id); if (el && val) el.placeholder = val; };

    set('heroTitle1Text', settings.heroTitle1);
    set('heroTitle2Text', settings.heroTitle2);
    set('heroSubtitleText', settings.heroSubtitle);
    setPh('heroSearch', settings.heroSearchPlaceholder);
    setPh('heroSearchCat', settings.heroSearchPlaceholder);

    set('stat1NumText', settings.stat1Num);
    set('stat1LabelText', settings.stat1Label);
    set('stat2NumText', settings.stat2Num);
    set('stat2LabelText', settings.stat2Label);

    if (settings.heroVisible === false) {
      document.querySelectorAll('.site-hero-section').forEach(el => el.style.display = 'none');
    }
  }

  // ---- CONTACT INFO ----
  function applyContactInfo(settings) {
    if (settings.contactPhone) {
      const digits = settings.contactPhone.replace(/[^0-9+]/g, '');
      document.querySelectorAll('.contact-phone-text').forEach(el => el.textContent = settings.contactPhone);
      document.querySelectorAll('.contact-phone-link').forEach(el => el.href = 'tel:' + digits);
    }
    if (settings.contactEmail) {
      document.querySelectorAll('.contact-email-text').forEach(el => el.textContent = settings.contactEmail);
      document.querySelectorAll('.contact-email-link').forEach(el => el.href = 'mailto:' + settings.contactEmail);
    }
    if (settings.contactWhatsapp) {
      document.querySelectorAll('.contact-whatsapp-link').forEach(el => el.href = 'https://wa.me/' + settings.contactWhatsapp);
    }
    if (settings.contactTelegram) {
      document.querySelectorAll('.contact-telegram-link').forEach(el => el.href = 'https://t.me/' + settings.contactTelegram);
    }
  }

  // ---- ADSENSE PUBLISHER ID + SLOT IDS ----
  function applyAdSenseConfig(settings) {
    if (settings.publisherId) {
      document.querySelectorAll('ins.adsbygoogle').forEach(el => {
        el.setAttribute('data-ad-client', settings.publisherId);
      });
      document.querySelectorAll('script[src*="adsbygoogle.js"]').forEach(el => {
        try {
          const url = new URL(el.src);
          url.searchParams.set('client', settings.publisherId);
          el.src = url.toString();
        } catch (e) {}
      });
    }

    // Per-slot overrides saved separately by admin "Manage Ads"
    const slotMap = JSON.parse(localStorage.getItem('adSlots') || '{}');
    const slotToOriginal = {
      '1111111111': slotMap.header,
      '2222222222': slotMap.content1,
      '3333333333': slotMap.sidebar,
      '4444444444': slotMap.mobile,
      '5555555555': slotMap.download,
      '6666666666': slotMap.content2,
      '7777777777': slotMap.bottom,
    };
    document.querySelectorAll('ins.adsbygoogle').forEach(el => {
      const current = el.getAttribute('data-ad-slot');
      const replacement = slotToOriginal[current];
      if (replacement) el.setAttribute('data-ad-slot', replacement);
    });

    // Hide sticky mobile ad if disabled
    if (settings.showStickyAd === false) {
      document.getElementById('stickyMobileAd')?.style && (document.getElementById('stickyMobileAd').style.display = 'none');
    }
  }

  // ---- SECTION VISIBILITY (Trending, Categories, Music, Invitations, GIFs, Wallpapers) ----
  function applySectionVisibility() {
    const vis = JSON.parse(localStorage.getItem('sectionVisibility') || '{}');
    Object.keys(vis).forEach(key => {
      if (vis[key] === false) {
        document.querySelectorAll('[data-section="' + key + '"]').forEach(el => el.style.display = 'none');
      }
    });
  }

  // ---- ANNOUNCEMENT BAR ----
  function applyAnnouncementBar(settings) {
    const ann = settings.announcement;
    if (!ann || !ann.enabled || !ann.text) return;

    const colors = {
      brand: 'linear-gradient(90deg,#7c3aed,#3b82f6)',
      green: 'linear-gradient(90deg,#059669,#10b981)',
      red:   'linear-gradient(90deg,#dc2626,#ef4444)',
      blue:  'linear-gradient(90deg,#2563eb,#3b82f6)'
    };
    const bar = document.createElement('div');
    bar.id = 'announcementBar';
    bar.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:60;background:${colors[ann.color] || colors.brand};color:#fff;text-align:center;font-size:.8125rem;font-weight:600;padding:8px 36px;`;
    bar.innerHTML = ann.text + `<button onclick="document.getElementById('announcementBar').remove();document.body.style.paddingTop='0'" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.2);border:none;color:#fff;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:.75rem;line-height:1;">✕</button>`;
    document.body.prepend(bar);
    // Push navbar down
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.style.top = bar.offsetHeight + 'px';
    document.body.style.paddingTop = bar.offsetHeight + 'px';
  }
})();
