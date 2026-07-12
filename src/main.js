// 
// IZAKAYA IKKYU (居酒屋 一休)
// Interactivity & Page Logic
//

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initScrollReveal();
  initHeroParallax();
  initMenuFilters();
  initGalleryLightbox();
  initSmoothScroll();
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

/**
 * Filter menu category grids dynamically
 */
function initMenuFilters() {
  const tabButtons = document.querySelectorAll('.menu-tab-btn');
  const menuItems = document.querySelectorAll('.menu-item');
  const menuGrid = document.getElementById('menu-items-grid');

  if (tabButtons.length === 0 || menuItems.length === 0) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedCategory = btn.getAttribute('data-category');

      // Update active button state
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Fade out grid before item modification
      if (menuGrid) {
        menuGrid.style.opacity = '0.3';
      }

      setTimeout(() => {
        menuItems.forEach(item => {
          const itemCategories = item.getAttribute('data-category').split(' ');

          if (selectedCategory === 'all' || itemCategories.includes(selectedCategory)) {
            item.style.display = 'flex';
            // slight delay to play nice with CSS smooth transitions
            setTimeout(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            }, 50);
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.95)';
            item.style.display = 'none';
          }
        });

        // Fade grid back in
        if (menuGrid) {
          menuGrid.style.opacity = '1';
        }
      }, 200);
    });
  });
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

/**
 * Scroll Reveal Animations via Intersection Observer
 */
function initScrollReveal() {
  // Add js-enabled class to body to trigger CSS transitions
  document.body.classList.add('js-enabled');

  const revealElements = document.querySelectorAll('section, .sake-card, .menu-item, .polaroid-frame, .info-wood-board, .links-panel .map-btn');

  // Mark all targets with reveal class
  revealElements.forEach(el => {
    el.classList.add('reveal');
  });

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.12
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        obs.unobserve(entry.target); // Reveal only once
      }
    });
  }, observerOptions);

  revealElements.forEach(el => observer.observe(el));
}
