/* ============================================================
   StormTrack — Main Application
   - NWS Radar via Iowa State MESONET (IEM) tiles
   - NWS Alerts API
   - NWS Forecast API
   - Traffic Cameras overlay
   - Timeline animation
   - Station selector
   ============================================================ */

// ──────────────────────────────────────────
// CONFIG
// ──────────────────────────────────────────
const CONFIG = {
  defaultStation: 'KMKX',
  defaultProduct: 'bref_raw',
  defaultLat: 39.5, defaultLon: -98.35, defaultZoom: 4,
  frameCount: 12,            // number of radar frames
  frameInterval: 5 * 60,     // seconds between frames (5 min)
  animSpeed: 400,            // ms between animation frames
  nwsBase: 'https://api.weather.gov',
  iemRadar: 'https://mesonet.agron.iastate.edu',
  ridgeRadar: 'https://opengeo.ncep.noaa.gov/geoserver/conus',
  nominatim: 'https://nominatim.openstreetmap.org',
};

const PRODUCTS = {
  bref_raw:  { label: 'Base Reflectivity', unit: 'dBZ' },
  bvel_raw:  { label: 'Base Velocity',     unit: 'kts' },
  bsrvel_raw:{ label: 'Storm Rel. Vel.',   unit: 'kts' },
  bdsa:      { label: 'Corr. Reflectivity',unit: 'dBZ' },
  bdzdr:     { label: 'Diff. Reflectivity',unit: 'dB'  },
  n0q:       { label: 'Composite Refl.',   unit: 'dBZ' },
};

const MAP_STYLES = {
  dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light:     'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  topo:      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
};

const MAP_ATTRS = {
  dark:      '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
  light:     '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
  satellite: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics',
  topo:      '© <a href="https://opentopomap.org">OpenTopoMap</a>',
};

// ──────────────────────────────────────────
// STATE
// ──────────────────────────────────────────
let map, baseTile, radarLayer, alertLayer, cameraLayer, lightningLayer;
let currentStation = CONFIG.defaultStation;
let currentProduct = CONFIG.defaultProduct;
let currentStyle   = 'dark';
let radarFrames    = [];
let currentFrame   = 0;
let isPlaying      = false;
let playTimer      = null;
let alertData      = [];
let cameraMarkers  = [];
let stationMarkers = [];
let isDraggingTimeline = false;

// ──────────────────────────────────────────
// INIT
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  buildStationList();
  loadRadarFrames();
  loadAlerts();
  attachEvents();
  restoreState();
  // refresh alerts every 5 minutes
  setInterval(loadAlerts, 5 * 60 * 1000);
});

// ──────────────────────────────────────────
// MAP INIT
// ──────────────────────────────────────────
function initMap() {
  map = L.map('map', {
    center: [CONFIG.defaultLat, CONFIG.defaultLon],
    zoom: CONFIG.defaultZoom,
    zoomControl: true,
    attributionControl: true,
  });

  baseTile = L.tileLayer(MAP_STYLES.dark, {
    attribution: MAP_ATTRS.dark,
    maxZoom: 18,
    subdomains: 'abcd',
  }).addTo(map);

  // State boundaries overlay
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    opacity: 0.0,
    pane: 'overlayPane',
  });

  // Click on map → get weather
  map.on('click', onMapClick);
  map.on('contextmenu', e => e.originalEvent.preventDefault());
}

// ──────────────────────────────────────────
// RADAR
// ──────────────────────────────────────────
function buildRadarTimestamps() {
  const frames = [];
  const now = Math.floor(Date.now() / 1000);
  // Snap to nearest 5-min boundary
  const snap = Math.floor(now / 300) * 300;
  for (let i = CONFIG.frameCount - 1; i >= 0; i--) {
    frames.push(snap - i * CONFIG.frameInterval);
  }
  return frames;
}

function timestampToIEM(ts) {
  const d = new Date(ts * 1000);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

function getRadarTileURL(station, product, timestamp) {
  const ts = timestampToIEM(timestamp);
  // Iowa State MESONET radar tiles
  return `${CONFIG.iemRadar}/cache/tile.py/1.0.0/nexrad-n0q-${ts}/{z}/{x}/{y}.png`;
}

function getCompositeRadarURL(timestamp) {
  const ts = timestampToIEM(timestamp);
  return `${CONFIG.iemRadar}/cache/tile.py/1.0.0/nexrad-n0q-${ts}/{z}/{x}/{y}.png`;
}

async function loadRadarFrames() {
  showLoading(true);
  radarFrames = buildRadarTimestamps();
  buildTimeline();
  await showFrame(radarFrames.length - 1);
  showLoading(false);
  updateTimeDisplay();
}

async function showFrame(idx) {
  currentFrame = Math.max(0, Math.min(radarFrames.length - 1, idx));
  const ts = radarFrames[currentFrame];

  if (radarLayer) { map.removeLayer(radarLayer); radarLayer = null; }

  if (document.getElementById('toggleRadar').checked) {
    const url = getCompositeRadarURL(ts);
    radarLayer = L.tileLayer(url, {
      opacity: 0.75,
      maxZoom: 18,
      tileSize: 256,
      attribution: '© Iowa State MESONET / NWS',
    }).addTo(map);
  }

  updateTimeline();
  updateTimeDisplay();
}

function updateTimeDisplay() {
  if (!radarFrames.length) return;
  const ts = radarFrames[currentFrame];
  const d = new Date(ts * 1000);
  const opts = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
  document.getElementById('timeDisplay').textContent = d.toLocaleString('en-US', opts);
}

function buildTimeline() {
  const container = document.getElementById('timelineTimes');
  container.innerHTML = '';
  const indices = [0, Math.floor(radarFrames.length/4), Math.floor(radarFrames.length/2), Math.floor(3*radarFrames.length/4), radarFrames.length-1];
  indices.forEach(i => {
    const ts = radarFrames[i];
    const d = new Date(ts * 1000);
    const span = document.createElement('span');
    span.textContent = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    container.appendChild(span);
  });
}

function updateTimeline() {
  const pct = radarFrames.length > 1
    ? (currentFrame / (radarFrames.length - 1)) * 100
    : 100;
  document.getElementById('timelineProgress').style.width = pct + '%';
  document.getElementById('timelineThumb').style.left = pct + '%';
}

function play() {
  isPlaying = true;
  document.getElementById('btnPlay').textContent = '⏸';
  playTimer = setInterval(async () => {
    const next = (currentFrame + 1) % radarFrames.length;
    await showFrame(next);
  }, CONFIG.animSpeed);
}

function pause() {
  isPlaying = false;
  document.getElementById('btnPlay').textContent = '▶';
  if (playTimer) { clearInterval(playTimer); playTimer = null; }
}

function showLoading(v) {
  let el = document.getElementById('radarLoading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'radarLoading';
    el.className = 'radar-loading';
    el.innerHTML = '<div class="rl-dot"></div><span>Loading radar...</span>';
    document.body.appendChild(el);
  }
  el.classList.toggle('visible', v);
}

// ──────────────────────────────────────────
// NWS ALERTS
// ──────────────────────────────────────────
async function loadAlerts() {
  try {
    const res = await fetch(`${CONFIG.nwsBase}/alerts/active?status=actual&message_type=alert,update&limit=100`, {
      headers: { 'Accept': 'application/geo+json', 'User-Agent': '(StormTrack App, contact@stormtrack.app)' }
    });
    if (!res.ok) throw new Error('NWS alerts fetch failed');
    const data = await res.json();
    alertData = data.features || [];

    // Update badge
    const badge = document.getElementById('alertBadge');
    badge.textContent = alertData.length;
    badge.style.display = alertData.length > 0 ? 'flex' : 'none';

    renderAlertList();
    renderAlertPolygons();
  } catch (e) {
    console.error('Alert load error:', e);
    document.getElementById('alertList').innerHTML =
      '<div class="loading-alerts">Unable to load alerts. NWS API may be down.</div>';
  }
}

function getSeverityClass(sev) {
  const s = (sev||'').toLowerCase();
  if (s === 'extreme') return 'extreme';
  if (s === 'severe') return 'severe';
  return 'moderate';
}

function getAlertCategory(event) {
  const e = (event||'').toLowerCase();
  if (e.includes('tornado')) return 'tornado';
  if (e.includes('thunder') || e.includes('severe')) return 'thunderstorm';
  if (e.includes('winter') || e.includes('snow') || e.includes('ice') || e.includes('blizzard')) return 'winter';
  return '';
}

function renderAlertList() {
  const list = document.getElementById('alertList');
  if (!alertData.length) {
    list.innerHTML = '<div class="loading-alerts" style="color:var(--accent3)">✅ No active alerts</div>';
    return;
  }

  list.innerHTML = '';
  // Sort by severity
  const sorted = [...alertData].sort((a,b) => {
    const order = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
    return (order[a.properties.severity]||4) - (order[b.properties.severity]||4);
  });

  sorted.slice(0, 50).forEach((alert, idx) => {
    const p = alert.properties;
    const card = document.createElement('div');
    card.className = `alert-card ${getAlertCategory(p.event)}`;
    card.innerHTML = `
      <div class="alert-card-header" onclick="toggleAlertBody(${idx})">
        <div>
          <div class="alert-event">${p.event || 'Alert'}</div>
          <div class="alert-area">${(p.areaDesc||'').slice(0,60)}${(p.areaDesc||'').length>60?'…':''}</div>
        </div>
        <span class="alert-severity sev-${getSeverityClass(p.severity)}">${p.severity||'Unknown'}</span>
      </div>
      <div class="alert-body" id="alertBody${idx}">
        <div class="alert-desc">${(p.description||p.headline||'No description').slice(0,500)}</div>
      </div>`;
    list.appendChild(card);
  });
}

function toggleAlertBody(idx) {
  const body = document.getElementById('alertBody' + idx);
  if (body) body.classList.toggle('expanded');
}
window.toggleAlertBody = toggleAlertBody;

function renderAlertPolygons() {
  if (alertLayer) { map.removeLayer(alertLayer); alertLayer = null; }
  if (!document.getElementById('toggleAlerts').checked) return;

  const colors = { Extreme: '#ff3b3b', Severe: '#f5a623', Moderate: '#ffd500', Minor: '#00d4ff' };
  const layer = L.layerGroup();

  alertData.forEach(alert => {
    const p = alert.properties;
    const geo = alert.geometry;
    if (!geo) return;

    const color = colors[p.severity] || '#aaa';

    try {
      const poly = L.geoJSON(geo, {
        style: {
          color, weight: 2, opacity: 0.9,
          fillColor: color, fillOpacity: 0.08,
        }
      });
      poly.bindTooltip(`<b>${p.event}</b><br>${(p.areaDesc||'').slice(0,80)}`, {
        className: 'alert-polygon-tooltip', sticky: true
      });
      poly.addTo(layer);
    } catch(e) {}
  });

  alertLayer = layer;
  layer.addTo(map);
}

// ──────────────────────────────────────────
// TRAFFIC CAMERAS
// ──────────────────────────────────────────
function loadCameras() {
  if (cameraLayer) { map.removeLayer(cameraLayer); cameraLayer = null; }
  cameraMarkers = [];

  const layer = L.layerGroup();
  const zoom = map.getZoom();

  // Only show cameras at zoom >= 6 to avoid clutter
  if (zoom < 5) {
    cameraLayer = layer;
    layer.addTo(map);
    return;
  }

  const bounds = map.getBounds();

  TRAFFIC_CAMERAS.forEach(cam => {
    if (!bounds.contains([cam.lat, cam.lon])) return;

    const icon = L.divIcon({
      html: '<div class="camera-marker">📹</div>',
      className: '', iconSize: [24, 18], iconAnchor: [12, 9],
    });

    const marker = L.marker([cam.lat, cam.lon], { icon })
      .on('click', () => openCamera(cam));

    marker.bindTooltip(`📹 ${cam.name}`, { className: 'alert-polygon-tooltip', direction: 'top' });
    marker.addTo(layer);
    cameraMarkers.push(marker);
  });

  cameraLayer = layer;
  layer.addTo(map);
}

function openCamera(cam) {
  document.getElementById('cameraTitle').textContent = `📹 ${cam.name} (${cam.state})`;
  const img = document.getElementById('cameraImg');
  img.src = '';
  document.getElementById('cameraMeta').textContent = `${cam.state} • Loading...`;
  document.getElementById('cameraModal').classList.add('visible');

  // Try loading the camera image; fall back to a placeholder
  const tryLoad = () => {
    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.onload = () => {
      img.src = cam.img;
      document.getElementById('cameraMeta').textContent = `${cam.state} | ${new Date().toLocaleTimeString()}`;
    };
    testImg.onerror = () => {
      // Show a placeholder with camera info
      img.src = `https://placehold.co/700x400/0d1117/00d4ff?text=${encodeURIComponent(cam.name + '\n' + cam.state + ' DOT Camera')}`;
      document.getElementById('cameraMeta').textContent = `${cam.state} | Feed unavailable - click Open Full for live view`;
    };
    testImg.src = cam.img + '?t=' + Date.now();
  };
  tryLoad();

  document.getElementById('refreshCamera').onclick = tryLoad;
  document.getElementById('openCameraNewTab').onclick = () => window.open(cam.url || cam.img, '_blank');
}

// Update cameras on zoom/move
map.on && setTimeout(() => {
  map.on('moveend', () => {
    if (document.getElementById('toggleCameras').checked) loadCameras();
  });
  map.on('zoomend', () => {
    if (document.getElementById('toggleCameras').checked) loadCameras();
  });
}, 100);

// ──────────────────────────────────────────
// STATION MARKERS
// ──────────────────────────────────────────
function renderStationMarkers() {
  stationMarkers.forEach(m => map.removeLayer(m));
  stationMarkers = [];
  const zoom = map.getZoom();
  if (zoom < 5) return;

  STATIONS.forEach(s => {
    const isActive = s.id === currentStation;
    const icon = L.divIcon({
      html: `<div class="radar-marker ${isActive ? 'active' : ''}" title="${s.id}">${s.id.slice(1,4)}</div>`,
      className: '', iconSize: [26, 26], iconAnchor: [13, 13],
    });
    const m = L.marker([s.lat, s.lon], { icon })
      .on('click', () => selectStation(s.id));
    m.addTo(map);
    stationMarkers.push(m);
  });
}

// ──────────────────────────────────────────
// MAP CLICK → WEATHER POPUP
// ──────────────────────────────────────────
async function onMapClick(e) {
  const { lat, lng } = e.latlng;
  const popup = L.popup()
    .setLatLng(e.latlng)
    .setContent(`<div class="popup-title">Loading weather...</div>
                 <div class="popup-coords">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>`)
    .openOn(map);

  try {
    // Get NWS grid point
    const ptRes = await fetch(`${CONFIG.nwsBase}/points/${lat.toFixed(4)},${lng.toFixed(4)}`, {
      headers: { 'User-Agent': '(StormTrack, contact@stormtrack.app)', 'Accept': 'application/json' }
    });
    if (!ptRes.ok) throw new Error('No NWS coverage');
    const ptData = await ptRes.json();
    const props = ptData.properties;
    const city = props.relativeLocation?.properties?.city || '';
    const state = props.relativeLocation?.properties?.state || '';

    // Get current conditions
    const obsRes = await fetch(`${CONFIG.nwsBase}/stations/${props.radarStation}/observations/latest`, {
      headers: { 'User-Agent': '(StormTrack)', 'Accept': 'application/json' }
    });
    if (!obsRes.ok) throw new Error('No obs');
    const obs = await obsRes.json();
    const op = obs.properties;

    const tempC = op.temperature?.value;
    const tempF = tempC != null ? Math.round(tempC * 9/5 + 32) : '—';
    const windKph = op.windSpeed?.value;
    const windMph = windKph != null ? Math.round(windKph * 0.621) : '—';
    const windDir = op.windDirection?.value != null ? degreesToCardinal(op.windDirection.value) : '—';
    const humidity = op.relativeHumidity?.value != null ? Math.round(op.relativeHumidity.value) + '%' : '—';
    const vis = op.visibility?.value != null ? (op.visibility.value / 1609).toFixed(1) + ' mi' : '—';
    const dewF = op.dewpoint?.value != null ? Math.round(op.dewpoint.value * 9/5 + 32) + '°F' : '—';
    const desc = op.textDescription || '—';
    const station = props.radarStation || '—';

    popup.setContent(`
      <div class="popup-title">${city ? city + ', ' + state : lat.toFixed(3) + ', ' + lng.toFixed(3)}</div>
      <div class="popup-coords">${lat.toFixed(4)}, ${lng.toFixed(4)} • ${station}</div>
      <div class="popup-weather">
        <div class="popup-temp">${tempF}°F</div>
        <div class="popup-desc">${desc}</div>
        <div class="popup-grid">
          <div class="popup-stat"><div class="popup-stat-label">WIND</div><div class="popup-stat-val">${windDir} ${windMph} mph</div></div>
          <div class="popup-stat"><div class="popup-stat-label">HUMIDITY</div><div class="popup-stat-val">${humidity}</div></div>
          <div class="popup-stat"><div class="popup-stat-label">DEWPOINT</div><div class="popup-stat-val">${dewF}</div></div>
          <div class="popup-stat"><div class="popup-stat-label">VISIBILITY</div><div class="popup-stat-val">${vis}</div></div>
        </div>
      </div>`);
  } catch(e) {
    popup.setContent(`
      <div class="popup-title">${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
      <div class="popup-desc" style="color:var(--text-muted);font-size:11px">No NWS coverage at this location<br>or outside US territory</div>`);
  }
}

function degreesToCardinal(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

// ──────────────────────────────────────────
// STATION SELECTOR
// ──────────────────────────────────────────
function buildStationList() {
  const list = document.getElementById('stationList');
  list.innerHTML = '';
  renderFilteredStations('');
}

function renderFilteredStations(query) {
  const list = document.getElementById('stationList');
  list.innerHTML = '';
  const q = query.toLowerCase();
  const filtered = STATIONS.filter(s =>
    s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
  filtered.forEach(s => {
    const div = document.createElement('div');
    div.className = 'station-item' + (s.id === currentStation ? ' active' : '');
    div.innerHTML = `<span class="station-id">${s.id}</span><span class="station-name">${s.name}</span>`;
    div.onclick = () => selectStation(s.id);
    list.appendChild(div);
  });
}

function selectStation(id) {
  currentStation = id;
  document.getElementById('currentStationLabel').textContent = id;
  document.getElementById('stationSelector').classList.remove('visible');
  renderFilteredStations(document.getElementById('stationSearch').value);
  renderStationMarkers();
  toast(`Radar: ${id}`, 'info');
  loadRadarFrames();
}

// ──────────────────────────────────────────
// SEARCH
// ──────────────────────────────────────────
let searchTimer;
async function doSearch(q) {
  if (!q.trim()) {
    document.getElementById('searchResults').innerHTML = '';
    return;
  }
  try {
    const res = await fetch(`${CONFIG.nominatim}/search?format=json&q=${encodeURIComponent(q)}&countrycodes=us&limit=5`, {
      headers: { 'User-Agent': 'StormTrack App' }
    });
    const data = await res.json();
    const container = document.getElementById('searchResults');
    container.innerHTML = '';
    if (!data.length) {
      container.innerHTML = '<div class="search-result-item"><div class="search-result-text"><div class="search-result-name" style="color:var(--text-muted)">No results found</div></div></div>';
      return;
    }
    data.forEach(r => {
      const div = document.createElement('div');
      div.className = 'search-result-item';
      const icon = r.type === 'city' || r.type === 'administrative' ? '🏙️' : r.type === 'airport' ? '✈️' : '📍';
      div.innerHTML = `
        <span class="search-result-icon">${icon}</span>
        <div class="search-result-text">
          <div class="search-result-name">${r.display_name.split(',')[0]}</div>
          <div class="search-result-sub">${r.display_name.split(',').slice(1,3).join(',')||''}</div>
        </div>`;
      div.onclick = () => {
        map.setView([parseFloat(r.lat), parseFloat(r.lon)], 8);
        closeSearch();
      };
      container.appendChild(div);
    });
  } catch(e) {
    console.error('Search error', e);
  }
}

function closeSearch() {
  document.getElementById('searchOverlay').classList.remove('visible');
  document.getElementById('searchInput').value = '';
  document.getElementById('searchResults').innerHTML = '';
}

// ──────────────────────────────────────────
// MAP STYLE
// ──────────────────────────────────────────
function setMapStyle(style) {
  currentStyle = style;
  if (baseTile) map.removeLayer(baseTile);
  baseTile = L.tileLayer(MAP_STYLES[style] || MAP_STYLES.dark, {
    attribution: MAP_ATTRS[style] || MAP_ATTRS.dark,
    maxZoom: 18,
    subdomains: style === 'dark' || style === 'light' ? 'abcd' : 'abc',
  }).addTo(map);
  baseTile.setZIndex(0);
  if (radarLayer) radarLayer.setZIndex(1);
  document.querySelectorAll('.map-style-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.style === style);
  });
}

// ──────────────────────────────────────────
// PRODUCT SELECTOR
// ──────────────────────────────────────────
function setProduct(p) {
  currentProduct = p;
  document.getElementById('productDisplay').textContent = PRODUCTS[p]?.label || p;
  document.querySelectorAll('.product-btn:not(.map-style-btn)').forEach(b => {
    b.classList.toggle('active', b.dataset.product === p);
  });
  loadRadarFrames();
}

// ──────────────────────────────────────────
// TIMELINE DRAG
// ──────────────────────────────────────────
function initTimelineDrag() {
  const track = document.getElementById('timelineTrack');

  const getFrameFromEvent = (e) => {
    const rect = track.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    return Math.round(pct * (radarFrames.length - 1));
  };

  track.addEventListener('mousedown', e => {
    isDraggingTimeline = true;
    pause();
    showFrame(getFrameFromEvent(e));
  });
  track.addEventListener('touchstart', e => {
    isDraggingTimeline = true;
    pause();
    showFrame(getFrameFromEvent(e));
  }, { passive: true });

  document.addEventListener('mousemove', e => {
    if (isDraggingTimeline) showFrame(getFrameFromEvent(e));
  });
  document.addEventListener('touchmove', e => {
    if (isDraggingTimeline) showFrame(getFrameFromEvent(e));
  }, { passive: true });

  document.addEventListener('mouseup', () => { isDraggingTimeline = false; });
  document.addEventListener('touchend', () => { isDraggingTimeline = false; });
}

// ──────────────────────────────────────────
// TOAST NOTIFICATIONS
// ──────────────────────────────────────────
function toast(msg, type = 'info', duration = 3000) {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warn: '⚠️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ──────────────────────────────────────────
// STATE PERSISTENCE
// ──────────────────────────────────────────
function restoreState() {
  try {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace('#', '?'));
      const lat = parseFloat(params.get('lat'));
      const lon = parseFloat(params.get('lon'));
      const zoom = parseInt(params.get('z'));
      const station = params.get('station');
      const product = params.get('product');
      if (!isNaN(lat) && !isNaN(lon)) map.setView([lat, lon], zoom || 6);
      if (station) selectStation(station);
      if (product && PRODUCTS[product]) setProduct(product);
    }
  } catch(e) {}

  // Save state on move
  map.on('moveend', saveState);
}

function saveState() {
  const center = map.getCenter();
  const hash = `#lat=${center.lat.toFixed(4)}&lon=${center.lng.toFixed(4)}&z=${map.getZoom()}&station=${currentStation}&product=${currentProduct}`;
  history.replaceState(null, '', hash);
}

// ──────────────────────────────────────────
// EVENTS
// ──────────────────────────────────────────
function attachEvents() {
  initTimelineDrag();

  // Menu toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sideMenu').classList.add('open');
    document.getElementById('sideMenuOverlay').classList.add('visible');
  });
  document.getElementById('sideMenuClose').addEventListener('click', closeMenu);
  document.getElementById('sideMenuOverlay').addEventListener('click', closeMenu);

  // Alert panel
  document.getElementById('alertsBtn').addEventListener('click', () => {
    document.getElementById('alertPanel').classList.toggle('open');
  });
  document.getElementById('closeAlertPanel').addEventListener('click', () => {
    document.getElementById('alertPanel').classList.remove('open');
  });

  // Search
  document.getElementById('searchBtn').addEventListener('click', () => {
    document.getElementById('searchOverlay').classList.add('visible');
    document.getElementById('searchInput').focus();
  });
  document.getElementById('searchClose').addEventListener('click', closeSearch);
  document.getElementById('searchOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('searchOverlay')) closeSearch();
  });
  document.getElementById('searchInput').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => doSearch(e.target.value), 350);
  });
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSearch();
  });

  // Radar station selector
  document.getElementById('radarSelectBtn').addEventListener('click', () => {
    document.getElementById('stationSelector').classList.toggle('visible');
  });
  document.getElementById('closeStationSelector').addEventListener('click', () => {
    document.getElementById('stationSelector').classList.remove('visible');
  });
  document.getElementById('stationSearch').addEventListener('input', e => {
    renderFilteredStations(e.target.value);
  });

  // Camera modal
  document.getElementById('closeCameraModal').addEventListener('click', () => {
    document.getElementById('cameraModal').classList.remove('visible');
  });
  document.getElementById('cameraModal').addEventListener('click', e => {
    if (e.target === document.getElementById('cameraModal')) {
      document.getElementById('cameraModal').classList.remove('visible');
    }
  });

  // Playback
  document.getElementById('btnPlay').addEventListener('click', () => {
    isPlaying ? pause() : play();
  });
  document.getElementById('btnStepBack').addEventListener('click', () => {
    pause();
    showFrame(currentFrame - 1);
  });
  document.getElementById('btnStepFwd').addEventListener('click', () => {
    pause();
    showFrame(currentFrame + 1);
  });

  // Nav pills
  document.querySelectorAll('.nav-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      handleModeChange(btn.dataset.mode);
    });
  });

  // Toggle overlays
  document.getElementById('toggleRadar').addEventListener('change', () => {
    if (document.getElementById('toggleRadar').checked) {
      showFrame(currentFrame);
    } else {
      if (radarLayer) { map.removeLayer(radarLayer); radarLayer = null; }
    }
  });
  document.getElementById('toggleAlerts').addEventListener('change', () => {
    if (document.getElementById('toggleAlerts').checked) {
      renderAlertPolygons();
    } else {
      if (alertLayer) { map.removeLayer(alertLayer); alertLayer = null; }
    }
  });
  document.getElementById('toggleCameras').addEventListener('change', e => {
    if (e.target.checked) {
      loadCameras();
      toast('Traffic cameras loaded. Zoom in to see cameras.', 'info');
    } else {
      if (cameraLayer) { map.removeLayer(cameraLayer); cameraLayer = null; }
    }
  });
  document.getElementById('toggleLightning').addEventListener('change', e => {
    if (e.target.checked) toast('Lightning overlay coming soon', 'warn');
  });
  document.getElementById('toggleFronts').addEventListener('change', e => {
    if (e.target.checked) toast('Surface fronts overlay coming soon', 'warn');
  });
  document.getElementById('toggleWind').addEventListener('change', e => {
    if (e.target.checked) toast('Wind barbs overlay coming soon', 'warn');
  });

  // Product buttons
  document.querySelectorAll('.product-btn:not(.map-style-btn)').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.product) setProduct(btn.dataset.product);
    });
  });

  // Map style buttons
  document.querySelectorAll('.map-style-btn').forEach(btn => {
    btn.addEventListener('click', () => setMapStyle(btn.dataset.style));
  });

  // Tools
  document.getElementById('btnMyLocation').addEventListener('click', () => {
    closeMenu();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 8);
        toast('Moved to your location', 'success');
      }, () => toast('Could not get location', 'error'));
    } else {
      toast('Geolocation not supported', 'error');
    }
  });

  document.getElementById('btnShareMap').addEventListener('click', () => {
    closeMenu();
    saveState();
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast('Map link copied!', 'success'));
    } else {
      prompt('Copy this link:', url);
    }
  });

  document.getElementById('btnMeasure').addEventListener('click', () => {
    closeMenu();
    toast('Click two points on the map to measure distance', 'info', 5000);
    startMeasure();
  });

  document.getElementById('btnScreenshot').addEventListener('click', () => {
    closeMenu();
    toast('Use your browser\'s screenshot tool or Print > Save as PDF', 'info');
  });

  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('sideMenu').classList.add('open');
    document.getElementById('sideMenuOverlay').classList.add('visible');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); isPlaying ? pause() : play(); }
    if (e.key === 'ArrowLeft') { pause(); showFrame(currentFrame - 1); }
    if (e.key === 'ArrowRight') { pause(); showFrame(currentFrame + 1); }
    if (e.key === 'Escape') { closeSearch(); closeMenu(); }
    if (e.key === '/') { e.preventDefault(); document.getElementById('searchOverlay').classList.add('visible'); document.getElementById('searchInput').focus(); }
  });
}

function closeMenu() {
  document.getElementById('sideMenu').classList.remove('open');
  document.getElementById('sideMenuOverlay').classList.remove('visible');
}

// ──────────────────────────────────────────
// MODE CHANGE (nav pill)
// ──────────────────────────────────────────
function handleModeChange(mode) {
  switch(mode) {
    case 'radar':
      document.getElementById('toggleRadar').checked = true;
      showFrame(currentFrame);
      break;
    case 'composite':
      setProduct('n0q');
      break;
    case 'satellite':
      setMapStyle('satellite');
      if (radarLayer) { map.removeLayer(radarLayer); radarLayer = null; }
      toast('Satellite view — radar overlay hidden', 'info');
      break;
    case 'models':
      toast('Model viewer: Select model output in the radar product menu', 'info');
      break;
    case 'outlooks':
      loadSPCOutlooks();
      break;
  }
}

// ──────────────────────────────────────────
// SPC OUTLOOKS (public GeoJSON)
// ──────────────────────────────────────────
async function loadSPCOutlooks() {
  toast('Loading SPC convective outlooks...', 'info');
  try {
    // SPC Day 1 Convective Outlook (public)
    const cats = ['TSTM','MRGL','SLGT','ENH','MDT','HIGH'];
    const colors = { TSTM: '#c0e8c0', MRGL: '#66c26a', SLGT: '#f6f67a', ENH: '#e8a832', MDT: '#e84842', HIGH: '#ff00ff' };

    const res = await fetch('https://www.spc.noaa.gov/products/outlook/day1otlk_cat.nolyr.geojson');
    if (!res.ok) throw new Error();
    const geo = await res.json();

    const layer = L.geoJSON(geo, {
      style: (f) => {
        const cat = f.properties.LABEL || 'TSTM';
        return { color: colors[cat]||'#aaa', weight: 2, fillColor: colors[cat]||'#aaa', fillOpacity: 0.15 };
      },
      onEachFeature: (f, l) => {
        l.bindTooltip(`SPC Day 1: ${f.properties.LABEL2 || f.properties.LABEL}`, { className: 'alert-polygon-tooltip' });
      }
    }).addTo(map);

    toast('SPC Day 1 Convective Outlook loaded', 'success');
  } catch(e) {
    toast('Could not load SPC outlook (CORS restrictions)', 'warn');
    // Fallback: open SPC in new tab
    window.open('https://www.spc.noaa.gov/products/outlook/', '_blank');
  }
}

// ──────────────────────────────────────────
// MEASURE TOOL
// ──────────────────────────────────────────
let measurePoints = [];
let measureLayer = null;

function startMeasure() {
  measurePoints = [];
  if (measureLayer) { map.removeLayer(measureLayer); measureLayer = null; }

  const handler = (e) => {
    measurePoints.push(e.latlng);
    if (measurePoints.length === 2) {
      map.off('click', handler);
      const dist = measurePoints[0].distanceTo(measurePoints[1]);
      const miles = (dist / 1609.34).toFixed(1);
      const km = (dist / 1000).toFixed(1);

      if (measureLayer) map.removeLayer(measureLayer);
      measureLayer = L.layerGroup([
        L.polyline(measurePoints, { color: '#00d4ff', weight: 2, dashArray: '6,4' }),
        L.popup()
          .setLatLng(measurePoints[1])
          .setContent(`<b>Distance</b><br>${miles} mi / ${km} km`)
          .openOn(map)
      ]).addTo(map);
    }
  };
  map.on('click', handler);
}

// ──────────────────────────────────────────
// INIT MAP EVENT LISTENERS (post-init)
// ──────────────────────────────────────────
setTimeout(() => {
  if (map) {
    map.on('zoomend', () => {
      const zoom = map.getZoom();
      if (zoom >= 5) renderStationMarkers();
      else { stationMarkers.forEach(m => map.removeLayer(m)); stationMarkers = []; }
    });
  }
}, 200);
