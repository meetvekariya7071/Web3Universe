/* ============================================
   PRICES.JS — Live CoinGecko Dashboard
   Web3 Universe Assignment
   ============================================ */

var refreshInterval = null;
var REFRESH_SECS = 60;
var countdown = REFRESH_SECS;
var isFetching = false;

/* ─── CoinGecko Endpoints ─── */
var API_FEATURED = 'https://api.coingecko.com/api/v3/simple/price'
  + '?ids=bitcoin,ethereum,solana,matic-network,arbitrum'
  + '&vs_currencies=usd'
  + '&include_24hr_change=true'
  + '&include_market_cap=true'
  + '&include_24hr_vol=true';

var API_TABLE = 'https://api.coingecko.com/api/v3/coins/markets'
  + '?vs_currency=usd&order=market_cap_desc&per_page=10&page=1'
  + '&sparkline=false&price_change_percentage=24h';

/* ─── Helpers ─── */
function fmt(n) {
  if (n == null) return '—';
  var a = Math.abs(n);
  if (a >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (a >= 1e9)  return '$' + (n / 1e9).toFixed(2)  + 'B';
  if (a >= 1e6)  return '$' + (n / 1e6).toFixed(2)  + 'M';
  if (a >= 1e3)  return '$' + (n / 1e3).toFixed(2)  + 'K';
  return '$' + n.toFixed(2);
}

function fmtPrice(n) {
  if (n == null) return '—';
  if (n >= 1000) return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return '$' + n.toFixed(4);
  return '$' + n.toFixed(8);
}

function fmtChange(n) {
  if (n == null) return { text: '—', cls: '' };
  var sign  = n >= 0 ? '+' : '';
  var arrow = n >= 0 ? '▲' : '▼';
  return { text: arrow + ' ' + sign + n.toFixed(2) + '%', cls: n >= 0 ? 'up' : 'down' };
}

function setLiveStatus(msg, err) {
  var el = document.getElementById('liveStatus');
  var ind = document.getElementById('liveIndicator');
  if (!el) return;
  el.textContent = msg;
  if (ind) {
    ind.classList.toggle('error', !!err);
  }
}

function setLastUpdated() {
  var el = document.getElementById('lastUpdated');
  if (!el) return;
  var now = new Date();
  el.textContent = 'Updated ' + now.toLocaleTimeString();
}

/* ─── Sparkline drawer ─── */
function drawSparkline(canvasId, prices, up) {
  var canvas = document.getElementById(canvasId);
  if (!canvas || !prices || prices.length < 2) return;
  var ctx = canvas.getContext('2d');
  var w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  var min = Math.min.apply(null, prices);
  var max = Math.max.apply(null, prices);
  var range = max - min || 1;

  var points = prices.map(function (p, i) {
    return {
      x: (i / (prices.length - 1)) * w,
      y: h - ((p - min) / range) * (h - 6) - 3
    };
  });

  // Gradient fill
  var grad = ctx.createLinearGradient(0, 0, 0, h);
  var color = up ? '16,185,129' : '239,68,68';
  grad.addColorStop(0, 'rgba(' + color + ',0.25)');
  grad.addColorStop(1, 'rgba(' + color + ',0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(function (pt) { ctx.lineTo(pt.x, pt.y); });
  ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(function (pt) { ctx.lineTo(pt.x, pt.y); });
  ctx.strokeStyle = 'rgba(' + color + ',0.8)';
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/* ─── Render featured BTC / ETH cards ─── */
function renderFeatured(data) {
  renderCoinCard('btc', 'bitcoin',  data.bitcoin,  'btcPrice', 'btcChange', 'btcStats', 'btcSparkline');
  renderCoinCard('eth', 'ethereum', data.ethereum, 'ethPrice', 'ethChange', 'ethStats', 'ethSparkline');
}

function renderCoinCard(id, key, coin, priceId, changeId, statsId, sparkId) {
  if (!coin) return;

  var priceEl  = document.getElementById(priceId);
  var changeEl = document.getElementById(changeId);
  var statsEl  = document.getElementById(statsId);

  if (priceEl)  priceEl.textContent  = fmtPrice(coin.usd);
  if (changeEl) {
    var ch = fmtChange(coin.usd_24h_change);
    changeEl.textContent = ch.text;
    changeEl.className = 'coin-change ' + ch.cls;
  }
  if (statsEl) {
    statsEl.innerHTML =
      '<div class="coin-stat-item"><span class="coin-stat-label">Market Cap</span><span class="coin-stat-value">' + fmt(coin.usd_market_cap) + '</span></div>' +
      '<div class="coin-stat-item"><span class="coin-stat-label">24h Volume</span><span class="coin-stat-value">' + fmt(coin.usd_24h_vol) + '</span></div>';
  }

  // Simple synthetic sparkline from current price ± small noise
  var up   = coin.usd_24h_change >= 0;
  var base = coin.usd;
  var pts  = [];
  for (var i = 0; i < 20; i++) {
    var noise = (Math.random() - 0.5) * base * 0.015;
    pts.push(base + noise);
  }
  pts[pts.length - 1] = base;
  drawSparkline(sparkId, pts, up);
}

/* ─── Render coins table ─── */
function renderTable(coins) {
  var body = document.getElementById('tableBody');
  if (!body) return;

  body.innerHTML = '';
  coins.forEach(function (coin) {
    var ch = fmtChange(coin.price_change_percentage_24h);
    var row = document.createElement('div');
    row.className = 'table-row';

    var initials = coin.symbol.slice(0, 3).toUpperCase();

    row.innerHTML =
      '<span class="tr-rank">' + coin.market_cap_rank + '</span>' +
      '<div class="tr-coin"><div class="tr-coin-symbol">' + initials + '</div>' +
        '<div><div class="tr-coin-name">' + coin.name + '</div>' +
             '<div class="tr-coin-ticker">' + coin.symbol.toUpperCase() + '</div></div></div>' +
      '<span class="tr-price">' + fmtPrice(coin.current_price) + '</span>' +
      '<span class="tr-change ' + ch.cls + '">' + ch.text + '</span>' +
      '<span class="tr-cap">'  + fmt(coin.market_cap) + '</span>' +
      '<span class="tr-vol">'  + fmt(coin.total_volume) + '</span>';

    body.appendChild(row);
  });
}

/* ─── Main fetch ─── */
function fetchPrices() {
  if (isFetching) return;
  isFetching = true;

  var refreshBtn  = document.getElementById('refreshBtn');
  var refreshIcon = document.getElementById('refreshIcon');
  var errorState  = document.getElementById('errorState');
  var coinsTable  = document.getElementById('coinsTableSection');

  if (refreshBtn)  refreshBtn.disabled = true;
  if (refreshIcon) refreshIcon.classList.add('spinning');
  setLiveStatus('Fetching live data…');
  if (errorState) errorState.classList.add('hidden');

  // Fetch both endpoints in parallel
  var p1 = fetch(API_FEATURED).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });

  var p2 = fetch(API_TABLE).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });

  Promise.all([p1, p2])
    .then(function (results) {
      renderFeatured(results[0]);
      renderTable(results[1]);
      setLastUpdated();
      setLiveStatus('Live — auto-refresh in ' + countdown + 's');
      if (coinsTable) coinsTable.classList.remove('hidden');
      startCountdown();
    })
    .catch(function (err) {
      console.error('CoinGecko fetch error:', err);
      setLiveStatus('Error fetching data', true);
      if (errorState) {
        errorState.classList.remove('hidden');
        var msgEl = document.getElementById('errorMsg');
        if (msgEl) msgEl.textContent = 'CoinGecko API error: ' + err.message + '. This is usually rate limiting — wait 60s and try again.';
      }
    })
    .finally(function () {
      isFetching = false;
      if (refreshBtn)  refreshBtn.disabled = false;
      if (refreshIcon) refreshIcon.classList.remove('spinning');
    });
}

/* ─── Countdown timer display ─── */
var countdownTimer = null;
function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdown = REFRESH_SECS;
  countdownTimer = setInterval(function () {
    countdown--;
    setLiveStatus('Live — auto-refresh in ' + countdown + 's');
    if (countdown <= 0) {
      clearInterval(countdownTimer);
      fetchPrices();
    }
  }, 1000);
}

/* ─── Init ─── */
(function init() {
  var refreshBtn = document.getElementById('refreshBtn');
  var retryBtn   = document.getElementById('retryBtn');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () {
      if (countdownTimer) clearInterval(countdownTimer);
      fetchPrices();
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      fetchPrices();
    });
  }

  // Initial fetch
  fetchPrices();
})();
