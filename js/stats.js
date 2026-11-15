// Calculs purs (sans DOM) : statut d'un jour, séries, taux de réussite, séries temporelles.
import { addDays, dayOfWeek, diffDays, range, startOfWeek, todayKey, maxKey } from './dates.js';

export const TYPES = {
  check: { label: 'Oui / non', hint: 'Je le fais ou pas' },
  quantity: { label: 'Quantité', hint: 'Un objectif chiffré par jour' },
  weekly: { label: 'X fois / semaine', hint: 'Un nombre de fois par semaine' },
  quit: { label: 'À arrêter', hint: 'Compter les jours sans' },
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function entryValue(entries, key) {
  const e = entries && entries[key];
  return e && typeof e.value === 'number' ? e.value : 0;
}

/** Premier jour suivi : date de début, ou plus ancienne saisie si antérieure. */
export function effectiveStart(habit, entries) {
  let start = habit.createdAt;
  if (entries) {
    for (const k of Object.keys(entries)) if (k < start) start = k;
  }
  return start;
}

/** Le jour est-il prévu pour cette habitude ? */
export function isScheduled(habit, key) {
  if (habit.type === 'check' || habit.type === 'quantity') {
    const days = habit.days && habit.days.length ? habit.days : ALL_DAYS;
    return days.includes(dayOfWeek(key));
  }
  return true;
}

/** Progression de la journée entre 0 et 1. */
export function dayProgress(habit, entries, key) {
  const v = entryValue(entries, key);
  switch (habit.type) {
    case 'quantity':
      return habit.target > 0 ? Math.min(v / habit.target, 1) : v > 0 ? 1 : 0;
    case 'quit':
      return v >= 1 ? 0 : 1;
    default:
      return v >= 1 ? 1 : 0;
  }
}

export function isDone(habit, entries, key) {
  return dayProgress(habit, entries, key) >= 1;
}

/**
 * Statut d'un jour :
 *  'before'  – avant le début du suivi
 *  'future'  – dans le futur
 *  'off'     – jour non prévu
 *  'done'    – réussi
 *  'partial' – commencé (quantité)
 *  'pending' – aujourd'hui, pas encore fait
 *  'missed'  – raté (ou rechute pour une habitude à arrêter)
 *  'empty'   – rien de fait, sans être un échec (habitude hebdomadaire)
 */
export function dayStatus(habit, entries, key, today = todayKey(), start = effectiveStart(habit, entries)) {
  if (key > today) return 'future';
  if (key < start) return 'before';
  const v = entryValue(entries, key);
  if (habit.type === 'quit') return v >= 1 ? 'missed' : 'done';
  if (habit.type === 'weekly') return v >= 1 ? 'done' : 'empty';
  const p = dayProgress(habit, entries, key);
  if (p >= 1) return 'done';
  if (!isScheduled(habit, key)) return 'off';
  if (p > 0) return 'partial';
  return key === today ? 'pending' : 'missed';
}

/** Nombre de réalisations dans la semaine commençant à `weekKey`. */
export function weekCount(habit, entries, weekKey) {
  let n = 0;
  for (let i = 0; i < 7; i++) if (entryValue(entries, addDays(weekKey, i)) >= 1) n++;
  return n;
}

export function weekTarget(habit) {
  return Math.max(1, habit.timesPerWeek || 1);
}

// ---------------------------------------------------------------------------
// Séries

/** Série actuelle. Unité : jours (ou semaines pour 'weekly'). */
export function currentStreak(habit, entries, today = todayKey(), weekStart = 1) {
  const start = effectiveStart(habit, entries);
  if (today < start) return 0;

  if (habit.type === 'weekly') {
    const target = weekTarget(habit);
    let wk = startOfWeek(today, weekStart);
    let n = 0;
    // La semaine en cours compte si l'objectif est atteint, sinon elle ne casse pas la série.
    if (weekCount(habit, entries, wk) >= target) n++;
    wk = addDays(wk, -7);
    while (addDays(wk, 6) >= start) {
      if (weekCount(habit, entries, wk) >= target) n++;
      else break;
      wk = addDays(wk, -7);
    }
    return n;
  }

  if (habit.type === 'quit') {
    let n = 0;
    let k = today;
    while (k >= start && entryValue(entries, k) < 1) {
      n++;
      k = addDays(k, -1);
    }
    return n;
  }

  let n = 0;
  let k = today;
  // Aujourd'hui non terminé ne casse pas la série.
  if (!isDone(habit, entries, k)) k = addDays(k, -1);
  while (k >= start) {
    if (isDone(habit, entries, k)) n++;
    else if (isScheduled(habit, k)) break;
    k = addDays(k, -1);
  }
  return n;
}

/** Meilleure série sur tout l'historique. */
export function bestStreak(habit, entries, today = todayKey(), weekStart = 1) {
  const start = effectiveStart(habit, entries);
  if (today < start) return 0;
  let best = 0;
  let cur = 0;

  if (habit.type === 'weekly') {
    const target = weekTarget(habit);
    const curWeek = startOfWeek(today, weekStart);
    for (let wk = startOfWeek(start, weekStart); wk <= curWeek; wk = addDays(wk, 7)) {
      if (weekCount(habit, entries, wk) >= target) cur++;
      else if (wk !== curWeek) cur = 0;
      best = Math.max(best, cur);
    }
    return best;
  }

  for (const k of range(start, today)) {
    if (isDone(habit, entries, k)) cur++;
    else if (habit.type === 'quit' || isScheduled(habit, k)) {
      if (k !== today || habit.type === 'quit') cur = 0;
    }
    best = Math.max(best, cur);
  }
  return best;
}

export function streakUnit(habit, n) {
  if (habit.type === 'weekly') return n > 1 ? 'semaines' : 'semaine';
  return n > 1 ? 'jours' : 'jour';
}

// ---------------------------------------------------------------------------
// Taux de réussite

/**
 * Taux de réussite entre `from` et `to` (inclus), bornés au début du suivi et à aujourd'hui.
 * Renvoie { done, total, rate } ou rate = null s'il n'y a rien à mesurer.
 */
export function completionRate(habit, entries, from, to, today = todayKey(), weekStart = 1) {
  const start = effectiveStart(habit, entries);
  const lo = maxKey(from, start);
  const hi = to > today ? today : to;
  let done = 0;
  let total = 0;
  if (lo > hi) return { done, total, rate: null };

  if (habit.type === 'weekly') {
    const target = weekTarget(habit);
    const curWeek = startOfWeek(today, weekStart);
    for (let wk = startOfWeek(lo, weekStart); wk <= hi; wk = addDays(wk, 7)) {
      const ok = weekCount(habit, entries, wk) >= target;
      if (wk === curWeek && !ok) continue; // semaine en cours pas encore jouée
      total++;
      if (ok) done++;
    }
    return { done, total, rate: total ? done / total : null };
  }

  for (const k of range(lo, hi)) {
    const ok = isDone(habit, entries, k);
    if (habit.type !== 'quit') {
      if (!isScheduled(habit, k) && !ok) continue;
      if (k === today && !ok) continue; // aujourd'hui pas encore terminé
    }
    total++;
    if (ok) done++;
  }
  return { done, total, rate: total ? done / total : null };
}

/** Nombre total de réussites (jours) depuis le début. */
export function totalDone(habit, entries, today = todayKey()) {
  const start = effectiveStart(habit, entries);
  let n = 0;
  if (habit.type === 'quit') {
    for (const k of range(start, today)) if (entryValue(entries, k) < 1) n++;
    return n;
  }
  for (const k of Object.keys(entries || {})) if (k <= today && isDone(habit, entries, k)) n++;
  return n;
}

export function totalSlips(entries) {
  return Object.values(entries || {}).filter((e) => e && e.value >= 1).length;
}

/** Somme des quantités sur la période (habitudes 'quantity'). */
export function sumValues(entries, from, to) {
  let s = 0;
  for (const [k, e] of Object.entries(entries || {})) if (k >= from && k <= to) s += e.value || 0;
  return s;
}

// ---------------------------------------------------------------------------
// Séries temporelles pour les graphiques

/** Taux par semaine sur les `n` dernières semaines : [{ week, rate, count }]. */
export function weeklySeries(habit, entries, n = 12, today = todayKey(), weekStart = 1) {
  const out = [];
  const curWeek = startOfWeek(today, weekStart);
  for (let i = n - 1; i >= 0; i--) {
    const wk = addDays(curWeek, -7 * i);
    const end = addDays(wk, 6);
    if (habit.type === 'weekly') {
      const count = weekCount(habit, entries, wk);
      const before = end < effectiveStart(habit, entries);
      out.push({ week: wk, rate: before ? null : Math.min(count / weekTarget(habit), 1), count });
    } else {
      const r = completionRate(habit, entries, wk, end, today, weekStart);
      out.push({ week: wk, rate: r.rate, count: r.done });
    }
  }
  return out;
}

/** Valeurs quotidiennes sur les `n` derniers jours : [{ key, value }]. */
export function dailySeries(habit, entries, n = 30, today = todayKey()) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = addDays(today, -i);
    out.push({ key: k, value: entryValue(entries, k), progress: dayProgress(habit, entries, k) });
  }
  return out;
}

/** Réussite par jour de la semaine : tableau indexé 0 (dim) … 6 (sam) de { done, total }. */
export function byWeekday(habit, entries, today = todayKey()) {
  const out = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }));
  const start = effectiveStart(habit, entries);
  for (const k of range(start, today)) {
    const ok = isDone(habit, entries, k);
    if (habit.type === 'check' || habit.type === 'quantity') {
      if (!isScheduled(habit, k) && !ok) continue;
      if (k === today && !ok) continue;
    }
    const d = dayOfWeek(k);
    out[d].total++;
    if (ok) out[d].done++;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Vue d'ensemble

/** Est-ce que l'habitude doit apparaître (et compter) aujourd'hui ? */
export function isDueOn(habit, entries, key, weekStart = 1) {
  if (habit.archived) return false;
  if (key < habit.createdAt && !entries?.[key]) return false;
  if (habit.type === 'check' || habit.type === 'quantity') return isScheduled(habit, key) || entryValue(entries, key) > 0;
  return true;
}

/** Comptée comme « faite » pour l'anneau du jour. */
export function countsAsDoneOn(habit, entries, key, weekStart = 1) {
  if (habit.type === 'weekly') {
    return entryValue(entries, key) >= 1 || weekCount(habit, entries, startOfWeek(key, weekStart)) >= weekTarget(habit);
  }
  return isDone(habit, entries, key);
}

/** Score global d'une journée : part des habitudes prévues réussies (null si aucune). */
export function globalDayScore(habits, allEntries, key, today = todayKey(), weekStart = 1) {
  let done = 0;
  let total = 0;
  for (const h of habits) {
    if (h.archived) continue;
    const entries = allEntries[h.id] || {};
    const st = dayStatus(h, entries, key, today);
    if (st === 'before' || st === 'future' || st === 'off') continue;
    if (h.type === 'weekly') {
      if (st === 'done') {
        done++;
        total++;
      }
      continue;
    }
    if (st === 'pending') continue;
    total++;
    done += dayProgress(h, entries, key) >= 1 ? 1 : 0;
  }
  return total ? done / total : null;
}

export function daysSince(fromKey, today = todayKey()) {
  return diffDays(fromKey, today);
}
