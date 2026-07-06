/* ============================================
   GLOBAL.JS — Shared Utilities
   Web3 Universe Assignment
   ============================================ */

// ---- Navbar Scroll Behavior ----
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (!navbar) return;

  // Scroll handler
  function onScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on init

  // Mobile toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close on link click
    navLinks.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }
})();

// ---- Intersection Observer for Fade-In Animations ----
(function initScrollAnimations() {
  if (!window.IntersectionObserver) return;

  const elements = document.querySelectorAll(
    '.feature-card, .concept-card, .timeline-item, .pillar, ' +
    '.how-item, .featured-price-card, .concept-item, .mine-stat-card'
  );

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(function (el, i) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s cubic-bezier(0.4,0,0.2,1) ' + (i * 0.05) + 's, transform 0.5s cubic-bezier(0.4,0,0.2,1) ' + (i * 0.05) + 's';
    observer.observe(el);
  });
})();

// ---- Utility: Format large numbers ----
function formatNumber(num, decimals) {
  if (num === null || num === undefined) return '—';
  decimals = decimals !== undefined ? decimals : 2;

  var abs = Math.abs(num);
  if (abs >= 1e12) return '$' + (num / 1e12).toFixed(decimals) + 'T';
  if (abs >= 1e9)  return '$' + (num / 1e9).toFixed(decimals)  + 'B';
  if (abs >= 1e6)  return '$' + (num / 1e6).toFixed(decimals)  + 'M';
  if (abs >= 1e3)  return '$' + (num / 1e3).toFixed(decimals)  + 'K';
  return '$' + num.toFixed(decimals);
}

function formatPrice(num) {
  if (num === null || num === undefined) return '—';
  if (num >= 1000) return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (num >= 1)    return '$' + num.toFixed(4);
  return '$' + num.toFixed(8);
}

// expose globally
window.formatNumber = formatNumber;
window.formatPrice  = formatPrice;
