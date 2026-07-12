// 
// IZAKAYA IKKYU (居酒屋 一休)
// Interactivity & Page Logic
//

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initScrollReveal();
  initHeroParallax();
  // initMenuFilters() is now initialized inside loadMenuItems after fetching data
  initGalleryLightbox();
  initSmoothScroll();
  
  loadMenuItems();
  loadSakeItems();
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

// Dynamic category mapping for Parent-Child tabs
const MENU_CATEGORIES = {
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

let allMenuItems = [];
let activeParentGroup = 'food';
let activeChildCategory = 'all';

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
      activeChildCategory = 'all';

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

  const categories = MENU_CATEGORIES[activeParentGroup];
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
    const allowedCategories = MENU_CATEGORIES[activeParentGroup].map(c => c.key);
    
    // 2. Filter items
    const filteredItems = allMenuItems.filter(item => {
      // Must belong to active parent group
      if (!allowedCategories.includes(item.category)) return false;
      
      // Must match sub-category filter if not 'all'
      if (activeChildCategory === 'all') return true;
      return item.category === activeChildCategory;
    });

    // 3. Render items HTML
    if (filteredItems.length === 0) {
      menuGrid.innerHTML = '<p class="error-placeholder" style="grid-column: 1/-1; text-align: center; color: var(--color-text-muted); padding: 3rem 0;">該当するメニューはありません。</p>';
    } else {
      menuGrid.innerHTML = filteredItems.map(item => {
        let badgeHTML = item.badge ? `<span class="menu-item-badge">${item.badge}</span>` : '';
        let descHTML = item.description ? `<p class="menu-item-desc">${item.description}</p>` : '';
        
        return `
          <div class="menu-item" data-category="${item.category}" id="${item.item_id}">
            ${badgeHTML}
            <div class="menu-item-header">
              <h4 class="menu-item-title">${item.title}</h4>
              <div class="menu-item-dots"></div>
              <span class="menu-item-price">${item.price_display}<span class="tax-inc"> ${item.tax_display}</span></span>
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

/**
 * Polaroid photo viewer Modal popups
 */
function initGalleryLightbox() {
  const polaroids = document.querySelectorAll('.polaroid-frame');
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const closeBtn = document.getElementById('lightbox-close-btn');

  if (polaroids.length === 0 || !lightbox || !lightboxImg || !lightboxCaption) return;

  polaroids.forEach(frame => {
    frame.addEventListener('click', () => {
      const img = frame.querySelector('img');
      const caption = frame.querySelector('.polaroid-caption');

      if (img && caption) {
        // Set lightbox details
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightboxCaption.textContent = caption.textContent;

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
    rootMargin: '0px',
    threshold: 0.12
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
    let apiUrl = '/api/menu';
    if (window.location.port && window.location.port !== '5001') {
      apiUrl = 'http://localhost:5001/api/menu';
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
    let apiUrl = '/api/sake';
    if (window.location.port && window.location.port !== '5001') {
      apiUrl = 'http://localhost:5001/api/sake';
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
      const cardEl = document.createElement('div');
      cardEl.className = 'sake-card';
      cardEl.id = item.item_id;

      cardEl.innerHTML = `
        <div class="sake-card-tag">${item.tag}</div>
        <div class="sake-card-name">${item.name}</div>
        <div class="sake-card-origin">${item.description}<br><span class="sake-card-price">${item.price_display} <span class="tax-label">${item.tax_display}</span></span></div>
        <img src="${item.image_src}" alt="${item.name}" class="sake-card-bottle-art">
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

