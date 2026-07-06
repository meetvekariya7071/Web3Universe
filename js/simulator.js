/* ============================================
   SIMULATOR.JS — Block Mining Simulator
   Web3 Universe Assignment
   Uses Web Crypto API (SHA-256) — no libraries
   ============================================ */

/* ─── SHA-256 via Web Crypto API ─── */
async function sha256(message) {
  var msgBuffer = new TextEncoder().encode(message);
  var hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  var hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

/* ─── State ─── */
var chain = [
  {
    index: 1,
    data: 'Genesis Block — First block in the chain.',
    nonce: 0,
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    hash: '',
    mined: false
  },
  {
    index: 2,
    data: 'Alice sends 1 ETH to Bob.',
    nonce: 0,
    prevHash: '',
    hash: '',
    mined: false
  }
];

var difficulty = 2; // hash must start with this many zeros
var isMining = [false, false];
var lastNonces = [null, null];

function getTarget() {
  return '0'.repeat(difficulty);
}

function isValidHash(hash) {
  return hash.startsWith(getTarget());
}

/* ─── Build input string for a block ─── */
function blockString(block) {
  return 'Block:' + block.index + '|Data:' + block.data + '|Prev:' + block.prevHash + '|Nonce:' + block.nonce;
}

/* ─── Render all blocks ─── */
async function renderChain() {
  for (var i = 0; i < chain.length; i++) {
    await renderBlock(i);
  }
  updateStats();
}

async function renderBlock(idx) {
  var block = chain[idx];
  var containerId = 'block-' + idx;
  var container   = document.getElementById(containerId);
  if (!container) return;

  // Compute current hash if not mined
  if (!block.mined) {
    block.hash = await sha256(blockString(block));
  }

  var valid = isValidHash(block.hash);

  // Update status badge
  var badge = container.querySelector('.block-status-badge');
  if (badge) {
    badge.textContent  = valid ? '✓ Valid' : '✗ Invalid';
    badge.className    = 'block-status-badge ' + (valid ? 'status-valid' : 'status-invalid');
  }

  // Update block border class
  container.classList.remove('valid', 'invalid');
  container.classList.add(valid ? 'valid' : 'invalid');

  // Update nonce display
  var nonceEl = container.querySelector('.nonce-display');
  if (nonceEl) nonceEl.textContent = block.nonce;

  // Update hash display
  var hashEl = container.querySelector('.hash-display');
  if (hashEl) {
    hashEl.textContent = block.hash;
    hashEl.className   = 'hash-display field-value mono ' + (valid ? 'valid-hash' : 'invalid-hash');
  }

  // Update connector after block 1
  if (idx === 0) {
    var connector = document.getElementById('chain-connector-0');
    if (connector) {
      connector.classList.toggle('broken', !valid);
      var icon = connector.querySelector('.chain-connector-icon');
      if (icon) icon.textContent = valid ? '⛓️' : '💔';
    }

    // Propagate hash to block 2 prevHash
    chain[1].prevHash = block.hash;
    var prevEl = document.getElementById('block-1').querySelector('.prev-hash-display');
    if (prevEl) prevEl.textContent = block.hash;
  }
}

/* ─── Mine a block (increment nonce until hash matches difficulty) ─── */
async function mineBlock(idx) {
  if (isMining[idx]) return;
  isMining[idx] = true;

  var block   = chain[idx];
  var mineBtn = document.getElementById('mine-btn-' + idx);
  var progEl  = document.getElementById('mine-progress-' + idx);

  if (mineBtn) {
    mineBtn.disabled = true;
    mineBtn.innerHTML = '<span class="mine-spinner"></span> Mining…';
  }

  block.nonce = 0;
  block.mined = false;

  var target = getTarget();
  var found  = false;
  var MAX_NONCE = 999999;

  // Async mining loop — yields to browser every 500 iterations
  while (block.nonce <= MAX_NONCE && !found) {
    var batchSize = 500;
    for (var i = 0; i < batchSize && block.nonce <= MAX_NONCE; i++) {
      block.hash = await sha256(blockString(block));
      if (block.hash.startsWith(target)) {
        found = true;
        break;
      }
      block.nonce++;
    }

    // Update UI mid-mining
    if (progEl) progEl.textContent = 'Trying nonce ' + block.nonce + '…';
    var nonceEl = document.getElementById('block-' + idx).querySelector('.nonce-display');
    if (nonceEl) nonceEl.textContent = block.nonce;

    // Yield to event loop
    await new Promise(function (r) { setTimeout(r, 0); });
  }

  if (found) {
    block.mined = true;
    lastNonces[idx] = block.nonce;
    if (progEl) progEl.textContent = 'Found at nonce ' + block.nonce + '!';
  } else {
    if (progEl) progEl.textContent = 'Max nonce reached — lower difficulty.';
  }

  if (mineBtn) {
    mineBtn.disabled = false;
    mineBtn.innerHTML = '⛏️ Mine Block ' + (idx + 1);
  }

  isMining[idx] = false;

  await renderBlock(idx);
  // If block 1 was mined, re-render block 2 (its prevHash changed)
  if (idx === 0) await renderBlock(1);
  updateStats();
}

/* ─── Stats panel ─── */
function updateStats() {
  var validCount = 0;
  var invalidCount = 0;

  chain.forEach(function (b) {
    if (isValidHash(b.hash)) validCount++;
    else invalidCount++;
  });

  var elBlocks  = document.getElementById('statBlocks');
  var elValid   = document.getElementById('statValid');
  var elInvalid = document.getElementById('statInvalid');
  var elHashes  = document.getElementById('statHashes');

  if (elBlocks)  elBlocks.textContent  = chain.length;
  if (elValid)   elValid.textContent   = validCount;
  if (elInvalid) {
    elInvalid.textContent = invalidCount;
    elInvalid.className   = 'mine-stat-val' + (invalidCount > 0 ? ' invalid' : '');
  }

  var lastNonce = lastNonces[0] !== null ? lastNonces[lastNonces.length - 1] : '—';
  if (elHashes) elHashes.textContent = lastNonce;
}

/* ─── Hash Lab ─── */
(function initHashLab() {
  var inputEl    = document.getElementById('hashInput');
  var outputEl   = document.getElementById('hashOutputText');
  var lengthEl   = document.getElementById('hashLength');
  var sizeEl     = document.getElementById('inputSize');

  if (!inputEl) return;

  var debounceTimer = null;

  async function updateHash() {
    var text = inputEl.value;
    var hash = await sha256(text);
    if (outputEl) outputEl.textContent = hash;
    if (lengthEl) lengthEl.textContent = hash.length;
    if (sizeEl)   sizeEl.textContent   = new TextEncoder().encode(text).length;
  }

  inputEl.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateHash, 120);
  });

  // Example pills
  document.querySelectorAll('.example-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      inputEl.value = pill.dataset.text;
      updateHash();
    });
  });

  updateHash(); // init
})();

/* ─── Difficulty slider ─── */
(function initDifficultySlider() {
  var slider  = document.getElementById('difficultySlider');
  var display = document.getElementById('difficultyDisplay');
  var prefix  = document.getElementById('targetPrefix');

  if (!slider) return;

  slider.addEventListener('input', function () {
    difficulty = parseInt(slider.value, 10);
    var label  = difficulty + ' zero' + (difficulty > 1 ? 's' : '');
    if (display) display.textContent = label;
    if (prefix)  prefix.textContent  = '0'.repeat(difficulty);

    // Reset mined state since difficulty changed
    chain.forEach(function (b) { b.mined = false; });
    renderChain();
  });
})();

/* ─── Data input listeners (chain break effect) ─── */
function attachDataListeners() {
  chain.forEach(function (block, idx) {
    var dataInput = document.getElementById('data-input-' + idx);
    if (!dataInput) return;

    var timer = null;
    dataInput.addEventListener('input', function () {
      block.data  = dataInput.value;
      block.mined = false;
      block.nonce = 0;

      clearTimeout(timer);
      timer = setTimeout(function () {
        renderBlock(idx).then(function () {
          // If block 1 data changes, block 2 also invalidates
          if (idx === 0) renderBlock(1);
        });
      }, 200);
    });
  });
}

/* ─── Build HTML for a block ─── */
function buildBlockHTML(block, idx) {
  var isGenesis = idx === 0;
  return [
    '<div class="sim-block invalid" id="block-' + idx + '">',
    '  <div class="block-top">',
    '    <span class="block-num">',
    '      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"/></svg>',
    '      Block #' + block.index,
    '    </span>',
    '    <span class="block-status-badge status-invalid">✗ Invalid</span>',
    '  </div>',
    '  <div class="block-body">',
    '    <div class="block-field block-field-full">',
    '      <div class="field-label">Block Data</div>',
    '      <textarea class="field-input textarea" id="data-input-' + idx + '" placeholder="Enter transaction data…">' + block.data + '</textarea>',
    '    </div>',
    '    <div class="block-field">',
    '      <div class="field-label">Previous Hash</div>',
    '      <div class="field-value prev-hash-display">' + (block.prevHash || '0000…0000') + '</div>',
    '    </div>',
    '    <div class="block-field">',
    '      <div class="field-label">Nonce</div>',
    '      <div class="nonce-display">0</div>',
    '    </div>',
    '    <div class="block-field">',
    '      <div class="field-label">Difficulty Target</div>',
    '      <div class="field-value mono" id="target-display-' + idx + '">' + getTarget() + '…</div>',
    '    </div>',
    '    <div class="block-field block-field-full">',
    '      <div class="field-label">SHA-256 Hash</div>',
    '      <div class="hash-display field-value mono invalid-hash">Computing…</div>',
    '    </div>',
    '  </div>',
    '  <div class="block-actions">',
    '    <button class="mine-btn" id="mine-btn-' + idx + '" onclick="mineBlock(' + idx + ')">⛏️ Mine Block ' + block.index + '</button>',
    '    <span class="mine-progress" id="mine-progress-' + idx + '">Click Mine to start proof-of-work</span>',
    '  </div>',
    '</div>'
  ].join('\n');
}

function buildConnectorHTML(idx) {
  return [
    '<div class="chain-connector" id="chain-connector-' + idx + '">',
    '  <span class="chain-connector-icon">💔</span>',
    '</div>'
  ].join('\n');
}

/* ─── Inject blocks into DOM ─── */
(function initChain() {
  var container = document.getElementById('chainContainer');
  if (!container) return;

  var html = '';
  chain.forEach(function (block, idx) {
    html += buildBlockHTML(block, idx);
    if (idx < chain.length - 1) {
      html += buildConnectorHTML(idx);
    }
  });
  container.innerHTML = html;

  attachDataListeners();
  renderChain();
})();
