// Point d'entrée : routeur, barre d'onglets, thème, service worker.
import { h, icon, clear, closeAllSheets } from './ui.js';
import { hideTip } from './charts.js';
import * as store from './store.js';
import { renderToday } from './views/today.js';
import { renderHabit } from './views/habit.js';
import { renderHabits } from './views/habits.js';
import { renderOverview } from './views/overview.js';
import { renderSettings } from './views/settings.js';
import { startReminderLoop } from './reminders.js';
import { todayKey } from './dates.js';

const routes = [
  { pattern: /^#\/?$/, view: renderToday, tab: 'today' },
  { pattern: /^#\/habits$/, view: renderHabits, tab: 'habits' },
  { pattern: /^#\/habit\/([\w-]+)$/, view: renderHabit, tab: 'habits', params: (m) => ({ id: m[1] }) },
  { pattern: /^#\/stats$/, view: renderOverview, tab: 'stats' },
  { pattern: /^#\/settings$/, view: renderSettings, tab: 'settings' },
];

const TABS = [
  { id: 'today', href: '#/', label: "Aujourd'hui", icon: 'today' },
  { id: 'habits', href: '#/habits', label: 'Habitudes', icon: 'list' },
  { id: 'stats', href: '#/stats', label: 'Stats', icon: 'stats' },
  { id: 'settings', href: '#/settings', label: 'Réglages', icon: 'settings' },
];

const main = document.getElementById('main');
const tabbar = document.getElementById('tabbar');
let currentHash = null;
let renderedDay = todayKey();

const nav = {
  go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  },
  back() {
    // Revenir en arrière seulement si on est arrivé ici depuis l'app (sinon lien direct).
    if (inAppNavigations > 0) history.back();
    else location.hash = '#/habits';
  },
  refresh: () => render({ keepScroll: true }),
};

function match() {
  const hash = location.hash || '#/';
  for (const r of routes) {
    const m = hash.match(r.pattern);
    if (m) return { ...r, params: r.params ? r.params(m) : {} };
  }
  return { ...routes[0], params: {} };
}

function render({ keepScroll = false } = {}) {
  hideTip();
  const route = match();
  const hash = location.hash || '#/';
  const sameView = hash === currentHash;
  const scroll = window.scrollY;
  currentHash = hash;
  renderedDay = todayKey();

  const page = h('div.page', { class: `page-${route.tab}` });
  route.view(page, route.params, nav);
  clear(main).append(page);

  if (keepScroll || sameView) window.scrollTo(0, scroll);
  else window.scrollTo(0, 0);

  drawTabs(route.tab);
  document.title = titleFor(route);
}

function titleFor(route) {
  if (route.params.id) {
    const hb = store.getHabit(route.params.id);
    if (hb) return `${hb.name} · Habitudes`;
  }
  const tab = TABS.find((t) => t.id === route.tab);
  return tab && tab.id !== 'today' ? `${tab.label} · Habitudes` : 'Habitudes';
}

function drawTabs(active) {
  clear(tabbar).append(
    ...TABS.map((t) =>
      h(
        'a.tab',
        { href: t.href, class: t.id === active ? 'active' : '', 'aria-current': t.id === active ? 'page' : null },
        icon(t.icon, 22),
        h('span', t.label),
      ),
    ),
  );
}

function applyTheme() {
  const { theme } = store.getSettings();
  const root = document.documentElement;
  if (theme === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  const dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1115' : '#f6f7fb');
}

let inAppNavigations = 0;
window.addEventListener('hashchange', () => {
  inAppNavigations++;
  closeAllSheets();
  render();
});

store.subscribe(() => {
  applyTheme();
  render({ keepScroll: true });
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

// Changement de jour pendant que l'app reste ouverte.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayKey() !== renderedDay) render({ keepScroll: true });
});
setInterval(() => {
  if (todayKey() !== renderedDay) render({ keepScroll: true });
}, 60 * 1000);

applyTheme();
render();
startReminderLoop();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker non enregistré', err));
  });
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'navigate' && e.data.url) location.hash = e.data.url;
  });
}
