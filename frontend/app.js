const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';

let currentPage  = 0;
let totalPages   = 0;
let currentSort  = 'date,asc';
let activeFilter = 'all';
let activeTab    = 'events';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('keyword').addEventListener('keypress', e => {
    if (e.key === 'Enter') doSearch();
  });
  document.getElementById('city').addEventListener('keypress', e => {
    if (e.key === 'Enter') doSearch();
  });
  document.getElementById('sort-select').addEventListener('change', e => {
    currentSort = e.target.value;
    doSearch();
  });
  loadCountries();
  populateYears();
  loadHolidays();
});

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-events').classList.toggle('active', tab === 'events');
  document.getElementById('tab-holidays').classList.toggle('active', tab === 'holidays');
  document.getElementById('section-events').style.display   = tab === 'events'   ? 'block' : 'none';
  document.getElementById('section-holidays').style.display = tab === 'holidays' ? 'block' : 'none';
}

async function doSearch(page = 0) {
  if (activeTab !== 'events') switchTab('events');
  const keyword  = document.getElementById('keyword').value.trim();
  const city     = document.getElementById('city').value.trim();
  const category = activeFilter !== 'all' ? activeFilter : '';
  currentPage    = page;

  showLoading('events-container');

  try {
    const params = new URLSearchParams({
      keyword, city,
      classificationName: category,
      sort: currentSort,
      page, size: 20
    });

    const res = await fetch(`${API_BASE}/events?${params}`);
const text = await res.text(); // get raw response
let data;

try {
  data = JSON.parse(text); // try parsing JSON
} catch (e) {
  console.error('Failed to parse JSON:', text);
  throw new Error('Failed to fetch events. Please check your server or API key.');
}

if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    totalPages = data.page?.totalPages || 1;
    renderEvents(data.events, data.page?.totalElements || 0, keyword || category || city);
    renderPagination();

  } catch (err) {
    showError('events-container', err.message);
    showToast(err.message);
  }
}

async function loadCountries() {
  try {
    const res  = await fetch(`${API_BASE}/countries`);
    const data = await res.json();
    const select = document.getElementById('country-select');
    select.innerHTML = '';
    data.countries.forEach(c => {
      const opt = document.createElement('option');
      opt.value       = c.countryCode;
      opt.textContent = c.name;
      if (c.countryCode === 'RW') opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error('Could not load countries:', err.message);
  }
}

// Populate the year select with current year ±5 years
function populateYears() {
  const yearSelect = document.getElementById('year-select');
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = '';
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if (y === currentYear) opt.selected = true;
    yearSelect.appendChild(opt);
  }
}

async function loadHolidays() {
  const countryCode = document.getElementById('country-select').value || 'RW';
  const year        = document.getElementById('year-select').value || new Date().getFullYear();

  showLoading('holidays-container');

  try {
    const res = await fetch(`${API_BASE}/holidays?countryCode=${countryCode}&year=${year}`);
    const text = await res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Invalid JSON:', text);
      throw new Error('Failed to fetch holidays. Please try again.');
    }

    if (!res.ok) throw new Error(data.error || 'Failed to fetch holidays.');

    renderHolidays(data.holidays, countryCode, year);

  } catch (err) {
    showError('holidays-container', err.message);
    showToast(err.message);
  }
}

function renderHolidays(holidays, countryCode, year) {
  const container = document.getElementById('holidays-container');

  if (!holidays || holidays.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No holidays found for ${countryCode} in ${year}.</p></div>`;
    return;
  }

  const rows = holidays.map(h => `
    <tr>
      <td>${formatDate(h.date)}</td>
      <td>${escHtml(h.name)}</td>
      <td>${escHtml(h.localName)}</td>
      <td>${escHtml(h.type)}</td>
    </tr>`).join('');

  container.innerHTML = `
    <p style="margin-bottom:14px; font-size:0.88rem; color:#555;">
      Showing <strong>${holidays.length}</strong> public holidays for <strong>${countryCode}</strong> in <strong>${year}</strong>
    </p>
    <table class="holidays-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Holiday</th>
          <th>Local Name</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderEvents(events, total, query) {
  const container = document.getElementById('events-container');

  if (!events || events.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No events found. Try a different search.</p></div>`;
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'events-grid';
  events.forEach(ev => grid.appendChild(buildCard(ev)));

  container.innerHTML = `<p style="margin-bottom:16px; color:#555; font-size:0.88rem;">
    Showing results for "<strong>${escHtml(query || 'all')}</strong>" &mdash; ${total.toLocaleString()} events found
  </p>`;
  container.appendChild(grid);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildCard(ev) {
  const a = document.createElement('a');
  a.className = 'event-card';
  a.href      = ev.url || '#';
  a.target    = '_blank';
  a.rel       = 'noopener noreferrer';

  const genre = ev.genre && ev.genre !== 'Undefined' ? ' - ' + ev.genre : '';

  let priceText = 'Check site';
  if (ev.priceMin === 0) priceText = 'Free';
  else if (ev.priceMin !== null) priceText = `${ev.currency} ${ev.priceMin.toFixed(0)}+`;

  const badgeMap = {
    onsale:    ['badge-onsale',    'On Sale'],
    offsale:   ['badge-offsale',   'Off Sale'],
    cancelled: ['badge-cancelled', 'Cancelled'],
    postponed: ['badge-postponed', 'Postponed'],
  };
  const [badgeClass, badgeLabel] = badgeMap[ev.status] || badgeMap.onsale;

  const imgHTML = ev.image
    ? `<img src="${escHtml(ev.image)}" alt="${escHtml(ev.name)}" loading="lazy"
         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
      + `<div class="card-placeholder" style="display:none">No Image</div>`
    : `<div class="card-placeholder">No Image</div>`;

  a.innerHTML = `
    ${imgHTML}
    <div class="card-body">
      <div class="card-category">${escHtml(ev.category)}${genre}</div>
      <div class="card-title">${escHtml(ev.name)}</div>
      <div class="card-date">${formatDate(ev.date)}${ev.time ? ' at ' + formatTime(ev.time) : ''}</div>
      <div class="card-venue">${escHtml(ev.venue)}${ev.city ? ', ' + escHtml(ev.city) : ''}</div>
    </div>
    <div class="card-footer">
      <span class="card-price">${priceText}</span>
      <span class="badge ${badgeClass}">${badgeLabel}</span>
    </div>`;

  return a;
}

function renderPagination() {
  const pg = document.getElementById('pagination');
  if (totalPages <= 1) { pg.style.display = 'none'; return; }
  pg.style.display = 'flex';
  document.getElementById('btn-prev').disabled = currentPage === 0;
  document.getElementById('btn-next').disabled = currentPage >= totalPages - 1;
  document.getElementById('page-info').textContent = `Page ${currentPage + 1} of ${totalPages}`;
}

function filterChip(btn) {
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = btn.dataset.filter;
  doSearch();
}

function changeSort(val) {
  currentSort = val;
  doSearch();
}

function showLoading(containerId) {
  document.getElementById(containerId).innerHTML =
    `<div class="loading-state"><div class="spinner"></div><p>Loading...</p></div>`;
  if (containerId === 'events-container') {
    document.getElementById('pagination').style.display = 'none';
  }
}

function showError(containerId, msg) {
  document.getElementById(containerId).innerHTML =
    `<div class="error-state"><p>Error: ${escHtml(msg)}</p></div>`;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

function formatDate(d) {
  if (!d || d === 'TBA') return 'Date TBA';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function showAbout() {
  const modal = document.getElementById('about-modal');
  modal.style.display = 'flex';
}

function closeAbout() {
  const modal = document.getElementById('about-modal');
  modal.style.display = 'none';
}
