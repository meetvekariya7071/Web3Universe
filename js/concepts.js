/* ============================================
   CONCEPTS.JS — Filter & Interactions
   Web3 Universe Assignment
   ============================================ */

// ---- Filter System ----
(function initFilterBar() {
  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.concept-card');
  if (!filterBtns.length) return;

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.dataset.filter;

      // Update active button
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      // Filter cards
      cards.forEach(function (card) {
        if (filter === 'all' || card.dataset.category === filter) {
          card.classList.remove('filtered-out');
          // Trigger re-animation
          card.style.animation = 'none';
          card.offsetHeight; // reflow
          card.style.animation = '';
        } else {
          card.classList.add('filtered-out');
        }
      });
    });
  });
})();

// ---- Card Hover Glow Effect ----
(function initCardGlow() {
  var cards = document.querySelectorAll('.concept-card');

  cards.forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      var y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      var glow = card.querySelector('.card-glow');
      if (glow) {
        glow.style.background = 'radial-gradient(circle at ' + x + '% ' + y + '%, rgba(99,102,241,0.07) 0%, transparent 60%)';
      }
    });
  });
})();
