// 
// IZAKAYA IKKYU (居酒屋 一休)
// Interactivity & Page Logic
//

const urlParams = new URLSearchParams(window.location.search);
const langParam = urlParams.get('lang');
let currentLang = (langParam === 'en' || langParam === 'ja') ? langParam : (localStorage.getItem('selected_language') || 'ja');


document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initScrollReveal();
  initHeroParallax();
  initLangSwitcher();
  // initMenuFilters() is now initialized inside loadMenuItems after fetching data
  initGalleryLightbox();
  initSmoothScroll();
  
  loadMenuItems();
  loadSakeItems();
  loadNewsItems();
  loadDailySpecials();
});

/**
 * Parallax floating elements in the Hero section based on mouse movements
 */
function initHeroParallax() {
  const hero = document.getElementById('hero');
  const lanternImg = document.querySelector('#hero-lantern img');
  const bottleImg = document.querySelector('#hero-bottle img');
  
  if (!hero || !lanternImg || !bottleImg) return;

  // Track current window size
  let width = window.innerWidth;
  let height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
  });

  // Calculate coordinates and smoothly translate images
  hero.addEventListener('mousemove', (e) => {
    // Only apply parallax on desktop/larger viewports to save battery/perf on mobile
    if (width < 768) return;

    const mouseX = e.clientX - width / 2;
    const mouseY = e.clientY - height / 2;

    // Different speeds of drifting
    const lanternX = mouseX * -0.025;
    const lanternY = mouseY * -0.025;
    const bottleX = mouseX * 0.035;
    const bottleY = mouseY * 0.035;

    // Apply translations directly to the img child
    // This allows the parent block to keep animating via keyframes (CSS float)
    lanternImg.style.transform = `translate3d(${lanternX}px, ${lanternY}px, 0)`;
    bottleImg.style.transform = `translate3d(${bottleX}px, ${bottleY}px, 0)`;
  });

  // Reset transforms on mouseout
  hero.addEventListener('mouseleave', () => {
    lanternImg.style.transform = 'translate3d(0, 0, 0)';
    bottleImg.style.transform = 'translate3d(0, 0, 0)';
  });
}

// Dynamic category mapping for Parent-Child tabs (Japanese)
const MENU_CATEGORIES_JA = {
  food: [
    { key: 'all', label: 'すべて' },
    { key: 'alacarte', label: 'アラカルト' },
    { key: 'salad', label: 'サラダ' },
    { key: 'fry', label: '揚げもの' },
    { key: 'grill', label: '焼きもの' },
    { key: 'stirfry', label: '炒めもの' },
    { key: 'hotpot', label: 'ミニ鍋' },
    { key: 'meal', label: '食事もの' }
  ],
  drink: [
    { key: 'all', label: 'すべて' },
    { key: 'beer', label: 'ビール' },
    { key: 'nonalcoholic', label: 'ノンアルコールビール' },
    { key: 'sake', label: 'お酒' },
    { key: 'umeshu', label: '梅酒' },
    { key: 'chuhai', label: 'チューハイ' },
    { key: 'highball', label: 'ハイボール' },
    { key: 'wine', label: 'ワイン(赤・白)' },
    { key: 'jizake', label: '地酒' },
    { key: 'shochu', label: '焼酎' },
    { key: 'shochu_keep', label: '焼酎ボトルキープ' },
    { key: 'softdrink', label: 'ソフトドリンク' }
  ]
};

// Dynamic category mapping for Parent-Child tabs (English with Japan Specials as first option)
const MENU_CATEGORIES_EN = {
  food: [
    { key: 'japan_recommend', label: '🇯🇵 Must-Try Specials' },
    { key: 'all', label: 'All Foods' },
    { key: 'alacarte', label: 'A La Carte' },
    { key: 'salad', label: 'Salads' },
    { key: 'fry', label: 'Fried Foods' },
    { key: 'grill', label: 'Grilled Foods' },
    { key: 'stirfry', label: 'Stir-Fried' },
    { key: 'hotpot', label: 'Mini Hot Pot' },
    { key: 'meal', label: 'Rice & Noodles' }
  ],
  drink: [
    { key: 'japan_recommend', label: '🇯🇵 Must-Try Sake & Drinks' },
    { key: 'all', label: 'All Drinks' },
    { key: 'beer', label: 'Beer' },
    { key: 'nonalcoholic', label: 'Non-Alcoholic Beer' },
    { key: 'sake', label: 'Standard Sake' },
    { key: 'umeshu', label: 'Plum Wine (Umeshu)' },
    { key: 'chuhai', label: 'Shochu Sour (Chuhai)' },
    { key: 'highball', label: 'Highball' },
    { key: 'wine', label: 'Wine' },
    { key: 'jizake', label: 'Premium Sake' },
    { key: 'shochu', label: 'Shochu' },
    { key: 'shochu_keep', label: 'Shochu Bottle Keep' },
    { key: 'softdrink', label: 'Soft Drinks' }
  ]
};

function getMenuCategories() {
  return currentLang === 'en' ? MENU_CATEGORIES_EN : MENU_CATEGORIES_JA;
}

let allMenuItems = [];
let allNewsItems = [];
let allDailySpecials = [];
let activeParentGroup = 'food';
let activeChildCategory = localStorage.getItem('selected_language') === 'en' ? 'japan_recommend' : 'all';

/**
 * Initialize parent tab events
 */
function initParentTabs() {
  const parentButtons = document.querySelectorAll('.menu-parent-tab-btn');
  if (parentButtons.length === 0) return;

  parentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedGroup = btn.getAttribute('data-group');
      if (selectedGroup === activeParentGroup) return;

      activeParentGroup = selectedGroup;
      activeChildCategory = (currentLang === 'en') ? 'japan_recommend' : 'all';

      // Update active button state
      parentButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Re-render child tabs and filter items
      renderChildTabs();
      filterAndRenderGrid();
    });
  });
}

/**
 * Dynamically render sub-category child tabs based on active parent group
 */
function renderChildTabs() {
  const tabContainer = document.getElementById('menu-tab-container');
  if (!tabContainer) return;

  const categories = getMenuCategories()[activeParentGroup];
  tabContainer.innerHTML = categories.map(cat => {
    const isActive = cat.key === activeChildCategory ? 'active' : '';
    return `<button class="menu-tab-btn ${isActive}" data-category="${cat.key}">${cat.label}</button>`;
  }).join('');

  // Re-bind click events to new child tab buttons
  const childButtons = tabContainer.querySelectorAll('.menu-tab-btn');
  childButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedCategory = btn.getAttribute('data-category');
      if (selectedCategory === activeChildCategory) return;

      activeChildCategory = selectedCategory;

      // Update active state
      childButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Scroll the selected tab into view smoothly
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

      // Filter and render items
      filterAndRenderGrid();
    });
  });
}

/**
 * Filter allMenuItems and render the grid dynamically
 */
function filterAndRenderGrid() {
  const menuGrid = document.getElementById('menu-items-grid');
  if (!menuGrid) return;

  // Fade out grid before item modification
  menuGrid.style.opacity = '0.3';

  setTimeout(() => {
    // 1. Get allowable categories in active parent group
    const allowedCategories = getMenuCategories()[activeParentGroup].map(c => c.key);
    
    // 2. Filter items
    const filteredItems = allMenuItems.filter(item => {
      // If we are in "Japan Special" recommendations filter mode
      if (activeChildCategory === 'japan_recommend') {
        const isFoodGroup = activeParentGroup === 'food';
        const itemIsFood = ['alacarte', 'salad', 'fry', 'grill', 'stirfry', 'hotpot', 'meal'].includes(item.category);
        const itemIsDrink = ['beer', 'nonalcoholic', 'sake', 'umeshu', 'chuhai', 'highball', 'wine', 'jizake', 'shochu', 'shochu_keep', 'softdrink'].includes(item.category);
        
        if (isFoodGroup && !itemIsFood) return false;
        if (!isFoodGroup && !itemIsDrink) return false;
        
        return item.is_recommend_en === 1;
      }

      if (!allowedCategories.includes(item.category)) return false;
      
      // Must match sub-category filter if not 'all'
      if (activeChildCategory === 'all') return true;
      return item.category === activeChildCategory;
    });

    // 3. Render items HTML
    if (filteredItems.length === 0) {
      const emptyMsg = (currentLang === 'en') ? 'No items found.' : '該当するメニューはありません。';
      menuGrid.innerHTML = `<p class="error-placeholder" style="grid-column: 1/-1; text-align: center; color: var(--color-text-muted); padding: 3rem 0;">${emptyMsg}</p>`;
    } else {
      menuGrid.innerHTML = filteredItems.map(item => {
        const title = (currentLang === 'en') ? item.title_en : item.title;
        const description = (currentLang === 'en') ? item.description_en : item.description;
        const badge = (currentLang === 'en') ? item.badge_en : item.badge;
        const priceDisplay = (currentLang === 'en') ? item.price_display_en : item.price_display;
        const taxDisplay = (currentLang === 'en') ? item.tax_display_en : item.tax_display;

        let badgeHTML = badge ? `<span class="menu-item-badge">${badge}</span>` : '';
        let descHTML = description ? `<p class="menu-item-desc">${description}</p>` : '';
        
        let recommendBadgeHTML = '';
        if (item.is_recommend_en) {
          const badgeText = (currentLang === 'en') ? '🇯🇵 Must Try' : 'おすすめ';
          recommendBadgeHTML = `<span class="menu-item-recommend-badge">${badgeText}</span>`;
        }

        const recommendedClass = item.is_recommend_en ? 'recommended' : '';

        return `
          <div class="menu-item ${recommendedClass}" data-category="${item.category}" id="${item.item_id}">
            ${badgeHTML}
            <div class="menu-item-header">
              <h4 class="menu-item-title">${title}${recommendBadgeHTML}</h4>
              <div class="menu-item-dots"></div>
              <span class="menu-item-price">${priceDisplay}<span class="tax-inc"> ${taxDisplay}</span></span>
            </div>
            ${descHTML}
          </div>
        `;
      }).join('');
    }

    // Fade grid back in
    menuGrid.style.opacity = '1';

    // Register dynamically added elements for scroll reveal
    const newItems = menuGrid.querySelectorAll('.menu-item');
    observeMenuItems(newItems);

  }, 150);
}

// Detailed modal definitions for seating types (Title removed as per user request)
const SEATING_DETAILS = {
  private: {
    ja: {
      badge: "1室限定 • 最大5名様",
      desc: "周囲を気にせずゆったりお寛ぎいただける半個室です。ご会食や少人数でのお祝い事に最適です。"
    },
    en: {
      badge: "1 Room Only • Up to 5 Guests",
      desc: "A cozy semi-private dining room where you can relax. Perfect for small gatherings and celebrations."
    }
  },
  table: {
    ja: {
      badge: "2卓 • 各4名様（計8名様）",
      desc: "木目の温もりを感じるテーブル席。お仕事帰りのサク飲みや、少人数のグループでのお食事に使い勝手の良いお席です。"
    },
    en: {
      badge: "2 Tables • 4 Guests Each (Max 8)",
      desc: "Warm wooden table seats. Ideal for a quick drink after work or casual group dinners with friends and colleagues."
    }
  },
  counter: {
    ja: {
      badge: "全5席 • お一人様大歓迎",
      desc: "木の温もりが漂う特等席。店主やスタッフとの会話を楽しみながら、自慢の手作り料理と厳選地酒を心ゆくまでお楽しみいただけます。"
    },
    en: {
      badge: "5 Seats Total • Solo Diners Welcome",
      desc: "Special seats along the warm wooden bar. Enjoy chatting with staff while savoring our handmade specialty dishes and curated sake."
    }
  },
  horigotatsu: {
    ja: {
      badge: "7卓 • 各3〜6名様（最大28名様）",
      desc: "足を伸ばして心地よくお過ごしいただける広々とした和風掘りごたつ。少人数から中規模・大規模なご宴会（貸切・団体様）まで幅広く対応可能です。"
    },
    en: {
      badge: "7 Tables • 3–6 Guests Each (Max 28)",
      desc: "Spacious sunken kotatsu tatami seating where you can stretch your legs. Accommodates small drinking parties to large corporate banquets."
    }
  }
};

/**
 * Polaroid photo viewer Modal popups
 */
function initGalleryLightbox() {
  const polaroids = document.querySelectorAll('.polaroid-frame');
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxBadge = document.getElementById('lightbox-badge');
  const lightboxDescription = document.getElementById('lightbox-description');
  const closeBtn = document.getElementById('lightbox-close-btn');

  if (polaroids.length === 0 || !lightbox || !lightboxImg) return;

  polaroids.forEach(frame => {
    frame.addEventListener('click', () => {
      const img = frame.querySelector('img');
      const seatingType = frame.getAttribute('data-seating-type');

      if (img) {
        // Set lightbox details
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;

        if (seatingType && SEATING_DETAILS[seatingType]) {
          const detail = SEATING_DETAILS[seatingType][currentLang] || SEATING_DETAILS[seatingType]['ja'];
          
          // Hide title caption as requested by user
          if (lightboxCaption) {
            lightboxCaption.textContent = '';
            lightboxCaption.style.display = 'none';
          }
          
          if (lightboxBadge) {
            lightboxBadge.textContent = detail.badge;
            lightboxBadge.style.display = 'inline-block';
          }
          if (lightboxDescription) {
            lightboxDescription.textContent = detail.desc;
            lightboxDescription.style.display = 'block';
          }
        } else {
          // Standard interior gallery photos
          const caption = frame.querySelector('.polaroid-caption');
          if (lightboxCaption) {
            lightboxCaption.textContent = caption ? caption.textContent : '';
            lightboxCaption.style.display = caption ? 'block' : 'none';
          }
          if (lightboxBadge) lightboxBadge.style.display = 'none';
          if (lightboxDescription) lightboxDescription.style.display = 'none';
        }

        // Open lightbox
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock background scrolling
      }
    });
  });

  // Close triggers
  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = ''; // Unlock scrolling
  };

  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  lightbox.addEventListener('click', (e) => {
    // Only close if user clicked the background, not the image itself
    if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
      closeLightbox();
    }
  });

  // Close when pressing Esc key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

/**
 * Elegant smooth scroll offsets for header links
 */
function initSmoothScroll() {
  const links = document.querySelectorAll('header a, .hero-cta');
  const headerHeight = document.querySelector('header').offsetHeight || 75;

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');

      // Check if it's an anchor on the same page
      if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          const elementPosition = targetElement.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerHeight + 5;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

/**
 * Mobile slide-out drawer menu toggle
 */
function initMobileNav() {
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navItems = document.querySelectorAll('.nav-links a');

  if (!menuToggle || !navLinks) return;

  const toggleMenu = () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('active');
    
    // Toggle body scroll locking when active
    if (navLinks.classList.contains('active')) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  menuToggle.addEventListener('click', toggleMenu);

  // Close when clicking any nav item link
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// Global observer for scroll reveal animations
let revealObserver = null;

/**
 * Scroll Reveal Animations via Intersection Observer
 */
function initScrollReveal() {
  // Add js-enabled class to body to trigger CSS transitions
  document.body.classList.add('js-enabled');

  // Select reveal targets, excluding menu-items which are loaded dynamically
  const revealElements = document.querySelectorAll('section, .sake-card, .polaroid-frame, .info-wood-board, .links-panel .map-btn');

  // Mark all targets with reveal class
  revealElements.forEach(el => {
    el.classList.add('reveal');
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px 80px 0px',
    threshold: 0.01
  };

  revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        obs.unobserve(entry.target); // Reveal only once
      }
    });
  }, observerOptions);

  revealElements.forEach(el => revealObserver.observe(el));
}

/**
 * Register dynamically loaded menu items for scroll reveal
 */
function observeMenuItems(menuItems) {
  if (!revealObserver) return;
  menuItems.forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });
}

/**
 * Fetch and render menu items dynamically from API
 */
async function loadMenuItems() {
  const menuGrid = document.getElementById('menu-items-grid');
  if (!menuGrid) return;

  try {
    let apiUrl = 'api/menu.json';
    if (window.location.protocol === 'file:') {
      apiUrl = 'http://localhost:5002/api/menu.json';
    }
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allMenuItems = await response.json();
    
    // Initialize parent tabs and dynamic child tabs rendering
    initParentTabs();
    renderChildTabs();
    filterAndRenderGrid();

  } catch (error) {
    console.error('Error loading menu items:', error);
    menuGrid.innerHTML = `
      <p class="error-placeholder" style="grid-column: 1/-1; text-align: center; color: var(--color-accent); padding: 3rem 0; font-size: 1.1rem; letter-spacing: 0.05em;">
        メニューの読み込みに失敗しました。再度お試しください。
      </p>
    `;
  }
}

/**
 * Fetch and render sake items dynamically from API
 */
async function loadSakeItems() {
  const sakeGrid = document.getElementById('sake-cards-grid');
  if (!sakeGrid) return;

  try {
    let apiUrl = 'api/sake.json';
    if (window.location.protocol === 'file:') {
      apiUrl = 'http://localhost:5002/api/sake.json';
    }
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const items = await response.json();
    
    // Clear loading placeholder
    sakeGrid.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    
    items.forEach(item => {
      const cardEl = document.createElement('a');
      
      const tag = (currentLang === 'en') ? item.tag_en : item.tag;
      const name = (currentLang === 'en') ? item.name_en : item.name;
      const description = (currentLang === 'en') ? item.description_en : item.description;
      const priceDisplay = (currentLang === 'en') ? item.price_display_en : item.price_display;
      const taxDisplay = (currentLang === 'en') ? item.tax_display_en : item.tax_display;
      const website = (currentLang === 'en') ? (item.website_en || item.website) : item.website;

      const isRecommend = item.is_recommend_en === 1;
      const recommendedClass = isRecommend ? 'recommended' : '';

      cardEl.className = `sake-card ${recommendedClass}`;
      cardEl.id = item.item_id;
      if (website) {
        cardEl.href = website;
        cardEl.target = '_blank';
        cardEl.rel = 'noopener noreferrer';
      } else {
        cardEl.href = '#';
      }

      let recommendBadge = '';
      if (isRecommend) {
        const badgeText = (currentLang === 'en') ? '🇯🇵 Must Try' : 'おすすめ';
        recommendBadge = `<span class="menu-item-recommend-badge" style="margin-left: 0; margin-top: 4px;">${badgeText}</span>`;
      }

      cardEl.innerHTML = `
        <div class="sake-card-tag" style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
          <span>${tag}</span>
          ${recommendBadge}
        </div>
        <div class="sake-card-name">${name}</div>
        <div class="sake-card-origin">${description}<br><span class="sake-card-price">${priceDisplay} <span class="tax-label">${taxDisplay}</span></span></div>
        <div class="sake-card-more">
          <span>${currentLang === 'en' ? 'Learn More' : '詳細を見る'}</span>
          <span class="arrow">→</span>
        </div>
        <img src="${item.image_src}" alt="${name}" class="sake-card-bottle-art">
      `;
      fragment.appendChild(cardEl);
    });

    sakeGrid.appendChild(fragment);
    
    // Register the sake cards to scroll reveal observer
    const newCards = sakeGrid.querySelectorAll('.sake-card');
    observeMenuItems(newCards);

  } catch (error) {
    console.error('Error loading sake items:', error);
    sakeGrid.innerHTML = `
      <p class="error-placeholder" style="grid-column: 1/-1; text-align: center; color: var(--color-accent); padding: 2rem 0; font-size: 1rem; width: 100%;">
        地酒メニューの読み込みに失敗しました。再度お試しください。
      </p>
    `;
  }
}

/**
 * Fetch and render news items dynamically from API
 */
async function loadNewsItems() {
  const newsContainer = document.getElementById('news-list-container');
  if (!newsContainer) return;

  try {
    let apiUrl = 'api/news.json';
    if (window.location.protocol === 'file:') {
      apiUrl = 'http://localhost:5002/api/news.json';
    }
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allNewsItems = await response.json();
    
    // Render the retrieved news items
    renderNewsItems();

  } catch (error) {
    console.error('Error loading news items:', error);
    newsContainer.innerHTML = `
      <p class="error-placeholder" style="text-align: center; color: var(--lantern-red); padding: 2rem 0; font-size: 1rem; width: 100%;">
        ${currentLang === 'en' ? 'Failed to load announcements.' : 'お知らせの読み込みに失敗しました。'}
      </p>
    `;
  }
}

/**
 * Render news items to the DOM based on selected language
 */
function renderNewsItems() {
  const newsContainer = document.getElementById('news-list-container');
  if (!newsContainer) return;
  
  if (!allNewsItems || allNewsItems.length === 0) {
    newsContainer.innerHTML = `
      <p style="text-align: center; color: var(--wood-light); padding: 2rem 0; width: 100%;">
        ${currentLang === 'en' ? 'No announcements at this time.' : '現在お知らせはありません。'}
      </p>
    `;
    return;
  }

  // Sort by date descending (newest first), fallback to ID if dates are equal
  const sortedNews = [...allNewsItems].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.id - a.id;
  });

  newsContainer.innerHTML = '';
  const fragment = document.createDocumentFragment();

  sortedNews.forEach(item => {
    const itemEl = document.createElement('article');
    itemEl.className = 'news-item reveal';
    
    const title = (currentLang === 'en') ? (item.title_en || item.title) : item.title;
    const content = (currentLang === 'en') ? (item.content_en || item.content) : item.content;
    
    // Formatting date (YYYY.MM.DD)
    const formattedDate = item.date.replace(/-/g, '.');

    itemEl.innerHTML = `
      <div class="news-meta">
        <time class="news-date" datetime="${item.date}">${formattedDate}</time>
      </div>
      <h3 class="news-item-title">${title}</h3>
      <p class="news-content">${content}</p>
    `;
    fragment.appendChild(itemEl);
  });

  newsContainer.appendChild(fragment);

  // Apply scroll reveal animations if helper available
  const newItems = newsContainer.querySelectorAll('.news-item');
  if (typeof observeMenuItems === 'function') {
    observeMenuItems(newItems);
  }
}

/**
 * Fetch and render daily special items dynamically from API
 */
async function loadDailySpecials() {
  const specialsGrid = document.getElementById('daily-specials-grid');
  if (!specialsGrid) return;

  try {
    let apiUrl = 'api/daily_specials.json';
    if (window.location.protocol === 'file:') {
      apiUrl = 'http://localhost:5002/api/daily_specials.json';
    }
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    allDailySpecials = await response.json();
    
    renderDailySpecials();

  } catch (error) {
    console.error('Error loading daily specials:', error);
    specialsGrid.innerHTML = `
      <p class="error-placeholder" style="grid-column: 1/-1; text-align: center; color: var(--lantern-red); padding: 2rem 0; font-size: 1rem; width: 100%;">
        ${currentLang === 'en' ? 'Failed to load daily specials.' : '本日のおすすめメニューの読み込みに失敗しました。'}
      </p>
    `;
  }
}

/**
 * Render daily specials items to DOM based on selected language
 */
function renderDailySpecials() {
  const specialsGrid = document.getElementById('daily-specials-grid');
  if (!specialsGrid) return;

  const activeSpecials = (allDailySpecials || []).filter(item => item.is_active !== 0);

  if (activeSpecials.length === 0) {
    specialsGrid.innerHTML = `
      <p style="grid-column: 1/-1; text-align: center; color: var(--wood-light); padding: 2.5rem 0; width: 100%;">
        ${currentLang === 'en' ? 'No daily specials available today.' : '本日のおすすめメニューは用意されていません。'}
      </p>
    `;
    return;
  }

  specialsGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();

  activeSpecials.forEach(item => {
    const cardEl = document.createElement('div');
    cardEl.className = 'special-card reveal';

    const title = (currentLang === 'en') ? (item.title_en || item.title) : item.title;
    const priceDisplay = (currentLang === 'en') ? (item.price_display_en || `${item.price} yen`) : (item.price_display || `${item.price}円`);
    const taxDisplay = (currentLang === 'en') ? (item.tax_display_en || `(incl. tax ${item.tax_price} yen)`) : (item.tax_display || `(税込${item.tax_price}円)`);

    cardEl.innerHTML = `
      <h3 class="special-card-title">${title}</h3>
      <div class="special-card-price-row">
        <span class="special-price-main">${priceDisplay}</span>
        <span class="special-price-tax">${taxDisplay}</span>
      </div>
    `;
    fragment.appendChild(cardEl);
  });

  specialsGrid.appendChild(fragment);

  // Apply scroll reveal animations
  const newCards = specialsGrid.querySelectorAll('.special-card');
  if (typeof observeMenuItems === 'function') {
    observeMenuItems(newCards);
  }
}


//
// MULTI-LANGUAGE TRANSLATION MAPPINGS & LOGIC
//
const STATIC_TRANSLATIONS = {
  ja: {
    "nav-news": "お知らせ",
    "news-title": "お知らせ",
    "nav-daily-specials": "本日のおすすめ",
    "daily-specials-title": "本日のおすすめ",
    "daily-specials-intro": "店主が毎日厳選する季節の旨いもの。旬の味わいを心を込めてご提供いたします。",
    "nav-specialty": "こだわり",
    "nav-menu": "お品書き",
    "nav-seating": "お座席",
    "seating-title": "お座席のご案内",
    "seating-private-badge": "1室 / 5席",
    "seating-private-name": "半個室",
    "seating-private-sub": "5名様まで対応の落ち着いた半個室空間",
    "seating-table-badge": "2卓 / 各4名様",
    "seating-table-name": "テーブル席",
    "seating-table-sub": "ご友人同士やグループでのご夕食に",
    "seating-counter-badge": "5席",
    "seating-counter-name": "カウンター席",
    "seating-counter-sub": "お一人様やちょい飲みに人気の木製カウンター",
    "seating-horigotatsu-badge": "7卓 / 各3〜6名様",
    "seating-horigotatsu-name": "掘りごたつ席",
    "seating-horigotatsu-sub": "足を伸ばして過ごせるゆったり座敷（最大28名）",
    "nav-gallery": "お店の雰囲気",
    "nav-access": "店舗情報",
    "hero-badge": "淀屋橋・北浜 隠れ家",
    "hero-tagline": "創業から愛される木製の温もりと、厳選を重ねた<br class=\"br-sp\">極上の旨い地酒。",
    "hero-booking": "【ご予約受付】お電話にて承ります：<a href=\"tel:06-6202-3644\" class=\"hero-tel-link\">06-6202-3644</a>",
    "hero-cta": "店舗情報・アクセス",
    "specialty-title": "一休のこだわり",
    "keep-badge": "10本毎に1本サービス",
    "keep-title": "焼酎<br class=\"br-sp\">ボトルキープ",
    "keep-desc": "常連様に長年愛され続ける<br class=\"br-sp\">一休の名物システム。<br>お気に入りの焼酎ボトル（黒霧島、いいちこ、二階堂など）をいつでもキープいたします。<span class=\"keep-hl\">10本キープいただく毎に、次の1本を無料でプレゼント</span>いたします。",
    "jizake-title": "厳選銘柄の地酒",
    "menu-title": "お品書き",
    "btn-parent-food": "フード<br>メニュー",
    "btn-parent-drink": "ドリンク<br>メニュー",
    "gallery-title": "お店の雰囲気",
    "polaroid-counter": "温もりのある木製カウンター席",
    "polaroid-table": "和の趣が落ち着く座敷・テーブル席",
    "polaroid-food": "まごころ込めた手作り名物料理",
    "access-title": "店舗情報",
    "info-name-label": "店名",
    "info-name-val": "居酒屋 一休 (居酒屋 一休)",
    "info-addr-label": "住所",
    "info-addr-val": "〒541-0041<br>大阪府大阪市中央区北浜3丁目3-11",
    "info-tel-label": "電話番号",
    "info-tel-val": "<a href=\"tel:06-6202-3644\" class=\"info-tel\">06-6202-3644</a><br><span style=\"font-size: 0.75rem; opacity: 0.6;\">(ご予約・お問合せはお気軽にどうぞ)</span>",
    "info-tel-sub": "(ご予約・お問合せはお気軽にどうぞ)",
    "info-hours-label": "営業時間",
    "info-hours-val": "17:00 ～ 23:00<br><span style=\"font-size: 0.8rem; opacity: 0.8;\">(ラストオーダー 22:30)</span>",
    "info-hours-sub": "(ラストオーダー 22:30)",
    "info-closed-label": "定休日",
    "info-closed-val": "土曜日・日曜日・祝日",
    "info-payment-label": "支払い方法",
    "info-payment-val": "カード可（Visa, Master, JCB, AMEX, Diners）<br>QRコード決済可（PayPay）",
    "booking-board-title": "ご予約について",
    "booking-board-desc": "当店はご予約をお電話にて承っております。<br>少人数からご宴会まで、お気軽にお電話ください。",
    "booking-board-btn": "📞 06-6202-3644 に電話する",
    "btn-tabelog-title": "食べログで詳細を見る",
    "btn-tabelog-desc": "メニュー詳細、口コミ、レビューの確認はこちら",
    "btn-google-title": "Google マップで開く",
    "btn-google-desc": "スマートフォンでの経路案内・GPSナビに最適",
    "btn-yahoo-title": "Yahoo!マップで開く",
    "btn-yahoo-desc": "高精度な地図表示と乗り換え検索ルート案内",
    "footer-text": "〒541-0041 大阪府大阪市中央区北浜3丁目3-11 | 電話: 06-6202-3644"
  },
  en: {
    "nav-news": "News",
    "news-title": "News & Announcements",
    "nav-daily-specials": "Today's Specials",
    "daily-specials-title": "Today's Daily Recommendations",
    "daily-specials-intro": "Chef's carefully selected seasonal delicacies prepared daily with heart.",
    "nav-specialty": "Our Specialty",
    "nav-menu": "Menu",
    "nav-seating": "Seating",
    "seating-title": "Seating Information",
    "seating-private-badge": "1 Room / 5 Seats",
    "seating-private-name": "Semi-Private Room",
    "seating-private-sub": "Cozy semi-private room accommodating up to 5 guests",
    "seating-table-badge": "2 Tables / 4 Seats Each",
    "seating-table-name": "Table Seats",
    "seating-table-sub": "Ideal for drinks with friends or group dining",
    "seating-counter-badge": "5 Seats",
    "seating-counter-name": "Counter Seats",
    "seating-counter-sub": "Popular wooden counter for solo diners or casual drinks",
    "seating-horigotatsu-badge": "7 Tables / 3–6 Seats Each",
    "seating-horigotatsu-name": "Horigotatsu (Sunken Kotatsu)",
    "seating-horigotatsu-sub": "Relaxing sunken floor seating for small to large groups (up to 28)",
    "nav-gallery": "Atmosphere",
    "nav-access": "Info & Location",
    "hero-badge": "Yodoyabashi • Kitahama Hideaway",
    "hero-tagline": "Loved since our founding, experience the warmth of wood and our carefully selected premium local sake.",
    "hero-booking": "[Reservations] Please call: <a href=\"tel:06-6202-3644\" class=\"hero-tel-link\">06-6202-3644</a>",
    "hero-cta": "Shop Info & Location",
    "specialty-title": "Our Specialty",
    "keep-badge": "1 Free Bottle for Every 10 Kept",
    "keep-title": "Shochu Bottle Keep",
    "keep-desc": "A long-time favorite system at Ikkyu.<br>Keep your favorite bottle of Shochu (Kurokirishima, Iichiko, Nikaido, etc.) at the shop. <span class=\"keep-hl\">For every 10 bottles kept, you will receive the next 1 bottle free of charge</span>.",
    "jizake-title": "Premium Selection of Sake",
    "menu-title": "Our Menu",
    "btn-parent-food": "Food<br>Menu",
    "btn-parent-drink": "Drink<br>Menu",
    "gallery-title": "Interior Gallery",
    "polaroid-counter": "Cozy wooden counter seats",
    "polaroid-table": "Relaxing Japanese tatami & table seating",
    "polaroid-food": "Heartfelt, handmade specialty dishes",
    "access-title": "Shop Information",
    "info-name-label": "Name",
    "info-name-val": "Izakaya Ikkyu",
    "info-addr-label": "Address",
    "info-addr-val": "3-3-11 Kitahama, Chuo-ku, Osaka, 541-0041",
    "info-tel-label": "Phone Number",
    "info-tel-val": "<a href=\"tel:06-6202-3644\" class=\"info-tel\">06-6202-3644</a><br><span style=\"font-size: 0.75rem; opacity: 0.6;\">(Please feel free to call for reservations or inquiries)</span>",
    "info-tel-sub": "(Please feel free to call for reservations or inquiries)",
    "info-hours-label": "Hours",
    "info-hours-val": "17:00 - 23:00<br><span style=\"font-size: 0.8rem; opacity: 0.8;\">(Last Order 22:30)</span>",
    "info-hours-sub": "(Last Order 22:30)",
    "info-closed-label": "Closed",
    "info-closed-val": "Saturdays, Sundays, and National Holidays",
    "info-payment-label": "Payment",
    "info-payment-val": "Credit Card (Visa, Master, JCB, AMEX, Diners)<br>QR Code Payment (PayPay)",
    "booking-board-title": "About Reservations",
    "booking-board-desc": "We accept reservations via phone.<br>From small groups to large banquets, please feel free to call us.",
    "booking-board-btn": "📞 Call 06-6202-3644",
    "btn-tabelog-title": "View details on Tabelog",
    "btn-tabelog-desc": "Check menu details, reviews, and ratings here",
    "btn-google-title": "Open in Google Maps",
    "btn-google-desc": "Ideal for turn-by-turn directions and GPS navigation",
    "btn-yahoo-title": "Open in Yahoo! Maps",
    "btn-yahoo-desc": "High-precision maps and transit route planning guides",
    "footer-text": "3-3-11 Kitahama, Chuo-ku, Osaka, 541-0041 | Phone: 06-6202-3644"
  }
};

/**
 * Initialize Language Switcher click listeners and set document state
 */
function initLangSwitcher() {
  const langToggle = document.getElementById('lang-switch-toggle');
  if (!langToggle) return;

  const options = langToggle.querySelectorAll('.lang-option');
  
  // Set initial active state based on currentLang
  options.forEach(opt => {
    if (opt.getAttribute('data-lang') === currentLang) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });

  // Attach click listener to each language button option
  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.preventDefault();
      const selectedLang = opt.getAttribute('data-lang');
      if (selectedLang === currentLang) return;
      
      setLanguage(selectedLang);
    });
  });
  
  // Apply document-wide initial translations
  applyTranslations();

  // Initialize SEO tags and Structured Data
  updateSeoHead();
  updateStructuredData();
}

/**
 * Switch language, update UI, and save to localStorage
 */
function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('selected_language', lang);
  document.documentElement.lang = lang;

  // URL Parameter synchronization (using replaceState to not pollute browser history)
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);

  // Update toggle state
  const langToggle = document.getElementById('lang-switch-toggle');
  if (langToggle) {
    const options = langToggle.querySelectorAll('.lang-option');
    options.forEach(opt => {
      if (opt.getAttribute('data-lang') === lang) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  // Update static text elements
  applyTranslations();

  // Update SEO tags and Structured Data
  updateSeoHead();
  updateStructuredData();
  
  // Default child category to recommendation tab in English, and 'all' in Japanese
  activeChildCategory = (currentLang === 'en') ? 'japan_recommend' : 'all';

  // Re-render menu tabs and grid
  renderChildTabs();
  filterAndRenderGrid();
  
  // Reload Sake cards
  loadSakeItems();

  // Re-render News items
  renderNewsItems();

  // Re-render Daily Specials items
  renderDailySpecials();
}

/**
 * Apply translation mappings to all static DOM elements
 */
function applyTranslations() {
  const translations = STATIC_TRANSLATIONS[currentLang];
  if (!translations) return;

  // Translate elements with data-translate-id attribute
  const elements = document.querySelectorAll('[data-translate-id]');
  elements.forEach(el => {
    const key = el.getAttribute('data-translate-id');
    if (translations[key] !== undefined) {
      el.innerHTML = translations[key];
    }
  });

  // Update document title
  if (currentLang === 'en') {
    document.title = "Izakaya Ikkyu | Traditional Japanese Pub in Yodoyabashi & Kitahama";
  } else {
    document.title = "居酒屋 一休 | 北浜・淀屋橋の伝統的な和風居酒屋";
  }

  // Update mobile floating call button tooltip
  const mobileCallBtn = document.getElementById('mobile-call-btn');
  if (mobileCallBtn) {
    mobileCallBtn.title = (currentLang === 'en') ? "Call for Inquiries & Reservations" : "電話で予約・問合せ";
  }
}

/**
 * Update Canonical and Alternate hreflang tags in the <head> dynamically
 */
function updateSeoHead() {
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  // Remove existing dynamic canonical and hreflang links
  document.querySelectorAll('link[data-dynamic-seo]').forEach(el => el.remove());

  const createLink = (rel, hreflang, href) => {
    const link = document.createElement('link');
    link.rel = rel;
    if (hreflang) {
      link.hreflang = hreflang;
    }
    link.href = href;
    link.setAttribute('data-dynamic-seo', 'true');
    document.head.appendChild(link);
  };

  // Canonical URL pointing to the current language page variant
  createLink('canonical', null, `${origin}${pathname}?lang=${currentLang}`);

  // Alternate for Japanese
  createLink('alternate', 'ja', `${origin}${pathname}?lang=ja`);

  // Alternate for English
  createLink('alternate', 'en', `${origin}${pathname}?lang=en`);

  // x-default points to default language (Japanese)
  createLink('alternate', 'x-default', `${origin}${pathname}`);
}

/**
 * Update Schema.org Structured Data (JSON-LD) dynamically based on current language
 */
function updateStructuredData() {
  const existingScript = document.getElementById('schema-jsonld');
  if (existingScript) {
    existingScript.remove();
  }

  const origin = window.location.origin;
  const isEn = currentLang === 'en';

  const schemaData = {
    "@context": "https://schema.org",
    "@type": ["BarOrPub", "Restaurant"],
    "@id": `${origin}/#restaurant`,
    "name": isEn ? "Izakaya Ikkyu" : "居酒屋 一休",
    "image": [
      `${origin}/assets/hero_bg.png`,
      `${origin}/assets/gallery_counter.png`,
      `${origin}/assets/gallery_table.png`,
      `${origin}/assets/gallery_food.png`
    ],
    "url": `${origin}${window.location.pathname}${isEn ? '?lang=en' : '?lang=ja'}`,
    "telephone": "+81-6-6202-3644",
    "priceRange": "¥¥",
    "paymentAccepted": "Cash, Credit Card, QR Code",
    "servesCuisine": isEn ? "Japanese, Sake, Izakaya" : "居酒屋, 和食, 日本酒",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "JP",
      "postalCode": "541-0041",
      "addressRegion": isEn ? "Osaka" : "大阪府",
      "addressLocality": isEn ? "Chuo-ku, Osaka" : "大阪市中央区",
      "streetAddress": isEn ? "3-3-11 Kitahama" : "北浜3丁目3-11"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 34.6875137,
      "longitude": 135.4983942
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday"
        ],
        "opens": "17:00",
        "closes": "23:00"
      }
    ],
    "hasMenu": `${origin}${window.location.pathname}#menu`,
    "sameAs": [
      "https://tabelog.com/osaka/A2701/A270102/27031404/",
      "https://www.google.com/maps/place/%E4%B8%80%E4%BC%91/@34.6875137,135.4958139,17z/data=!3m2!4b1!5s0x6000e6e49e9929cd:0x249d78865056d15f!4m6!3m5!1s0x6000e6e49c210547:0x34993830a1cda759!8m2!3d34.6875137!4d135.4983942!16s%2Fg%2F1td42crt?authuser=0&entry=ttu&g_ep=EgoyMDI2MDcwOC4wIKXMDSoASAFQAw%3D%3D",
      "https://map.yahoo.co.jp/v3/place/d02wFaVRN46"
    ]
  };

  const script = document.createElement('script');
  script.id = 'schema-jsonld';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(schemaData, null, 2);
  document.head.appendChild(script);
}

