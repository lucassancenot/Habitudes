// Utilitaires de dates. Toutes les dates « jour » sont des clés locales 'YYYY-MM-DD'.

const pad = (n) => String(n).padStart(2, '0');

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey() {
  return toKey(new Date());
}

/** Date locale à midi (évite les soucis de changement d'heure). */
export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Nombre de jours de a vers b (b - a). */
export function diffDays(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / 86400000);
}

/** 0 = dimanche … 6 = samedi */
export function dayOfWeek(key) {
  return fromKey(key).getDay();
}

/** Clé du premier jour de la semaine contenant `key`. weekStart : 1 = lundi, 0 = dimanche. */
export function startOfWeek(key, weekStart = 1) {
  const dow = dayOfWeek(key);
  const offset = (dow - weekStart + 7) % 7;
  return addDays(key, -offset);
}

export function startOfMonth(key) {
  return key.slice(0, 8) + '01';
}

export function daysInMonth(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

/** Liste de clés de `from` à `to` inclus. */
export function range(from, to) {
  const out = [];
  if (from > to) return out;
  let k = from;
  while (k <= to) {
    out.push(k);
    k = addDays(k, 1);
  }
  return out;
}

export function minKey(a, b) {
  return a < b ? a : b;
}
export function maxKey(a, b) {
  return a > b ? a : b;
}

const fmtCache = new Map();
function fmt(opts) {
  const id = JSON.stringify(opts);
  if (!fmtCache.has(id)) fmtCache.set(id, new Intl.DateTimeFormat('fr-FR', opts));
  return fmtCache.get(id);
}

export const formatLong = (key) => fmt({ weekday: 'long', day: 'numeric', month: 'long' }).format(fromKey(key));
export const formatShort = (key) => fmt({ day: 'numeric', month: 'short' }).format(fromKey(key));
export const formatFull = (key) => fmt({ day: 'numeric', month: 'long', year: 'numeric' }).format(fromKey(key));
export const formatMonth = (key) => fmt({ month: 'long', year: 'numeric' }).format(fromKey(key));
export const formatMonthShort = (key) => fmt({ month: 'short' }).format(fromKey(key));
export const weekdayShort = (key) => fmt({ weekday: 'short' }).format(fromKey(key)).replace('.', '');
export const weekdayNarrow = (key) => fmt({ weekday: 'narrow' }).format(fromKey(key));

/** Libellés des jours (index 0 = dimanche). */
export const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
export const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export function relativeDay(key, today = todayKey()) {
  const d = diffDays(key, today);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Hier';
  if (d === -1) return 'Demain';
  return formatLong(key);
}
