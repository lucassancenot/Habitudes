// Écran « Statistiques » : vue d'ensemble de toutes les habitudes.
import { h, icon, percent, formatNumber } from '../ui.js';
import { addDays, todayKey, range, formatShort, startOfWeek } from '../dates.js';
import * as store from '../store.js';
import * as S from '../stats.js';
import { heatmap, heatmapLegend, barChart } from '../charts.js';
import { MOODS, moodEmoji } from './entry.js';

const PERIODS = [
  { id: 7, label: '7 j' },
  { id: 30, label: '30 j' },
  { id: 90, label: '90 j' },
  { id: 365, label: '1 an' },
];
let period = 30;

export function renderOverview(root, params, nav) {
  const today = todayKey();
  const { weekStart } = store.getSettings();
  const habits = store.activeHabits();
  const { entries } = store.getState();

  root.append(h('header.page-header', h('div', h('p.eyebrow', 'Vue d’ensemble'), h('h1', 'Statistiques'))));

  if (!habits.length) {
    root.append(h('section.empty', h('div.empty-art', '📊'), h('h2', 'Pas encore de données'), h('p.muted', 'Crée une habitude et coche-la pour voir ta progression ici.')));
    return;
  }

  // --- Filtre de période (une seule rangée, au-dessus de tout)
  root.append(
    h(
      'div.segmented.period',
      PERIODS.map((p) => h('button', { class: p.id === period ? 'selected' : '', onclick: () => ((period = p.id), nav.refresh()) }, p.label)),
    ),
  );

  const from = addDays(today, -(period - 1));
  const days = range(from, today);
  const scores = days.map((k) => S.globalDayScore(habits, entries, k, today, weekStart));
  const valid = scores.filter((s) => s != null);
  const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  const perfect = valid.filter((s) => s >= 1).length;

  // Comparaison avec la période précédente
  const prevDays = range(addDays(from, -period), addDays(from, -1));
  const prevScores = prevDays.map((k) => S.globalDayScore(habits, entries, k, today, weekStart)).filter((s) => s != null);
  const prevAvg = prevScores.length ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length : null;
  const delta = avg != null && prevAvg != null ? Math.round((avg - prevAvg) * 100) : null;

  let bestStreak = { n: 0, hb: null };
  for (const hb of habits) {
    const n = S.currentStreak(hb, entries[hb.id] || {}, today, weekStart);
    const days = hb.type === 'weekly' ? n * 7 : n;
    if (days > (bestStreak.hb ? (bestStreak.hb.type === 'weekly' ? bestStreak.n * 7 : bestStreak.n) : 0)) bestStreak = { n, hb };
  }

  // Humeur moyenne
  const moods = [];
  for (const hb of habits) for (const [k, e] of Object.entries(entries[hb.id] || {})) if (k >= from && k <= today && e.mood) moods.push(e.mood);
  const moodAvg = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null;

  root.append(
    h(
      'section.stat-grid',
      h(
        'div.stat-tile',
        h('p.stat-label', 'Réussite moyenne'),
        h('p.stat-value', percent(avg)),
        delta != null && h('p.stat-sub', { class: delta > 0 ? 'up' : delta < 0 ? 'down' : '' }, `${delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : '= '}${delta} pts vs période précédente`),
      ),
      h('div.stat-tile', h('p.stat-label', 'Journées parfaites'), h('p.stat-value', formatNumber(perfect)), h('p.stat-sub', `sur ${valid.length} jour${valid.length > 1 ? 's' : ''} suivis`)),
      h(
        'div.stat-tile',
        h('p.stat-label', icon('flame', 14), 'Plus longue série en cours'),
        h('p.stat-value', bestStreak.hb ? `${bestStreak.n}` : '0'),
        h('p.stat-sub', bestStreak.hb ? `${S.streakUnit(bestStreak.hb, bestStreak.n)} · ${bestStreak.hb.icon} ${bestStreak.hb.name}` : '—'),
      ),
      h(
        'div.stat-tile',
        h('p.stat-label', 'Humeur moyenne'),
        h('p.stat-value', moodAvg ? moodEmoji(Math.round(moodAvg)) : '–'),
        h('p.stat-sub', moodAvg ? `${MOODS[Math.round(moodAvg) - 1].l} · ${moods.length} saisie${moods.length > 1 ? 's' : ''}` : 'Aucune humeur notée'),
      ),
    ),
  );

  // --- Calendrier global
  root.append(
    h(
      'section.card',
      h('div.card-head', h('h2', 'Régularité globale'), heatmapLegend('var(--accent)')),
      heatmap({
        weeks: 26,
        today,
        weekStart,
        color: 'var(--accent)',
        cell: (k) => {
          const s = S.globalDayScore(habits, entries, k, today, weekStart);
          if (s == null) return { level: null, label: 'Rien à suivre' };
          const level = s >= 1 ? 4 : s >= 0.66 ? 3 : s >= 0.33 ? 2 : s > 0 ? 1 : 0;
          return { level, label: `${Math.round(s * 100)} % des habitudes réussies` };
        },
      }),
    ),
  );

  // --- Tendance hebdomadaire
  const curWeek = startOfWeek(today, weekStart);
  const weeks = [];
  for (let i = 11; i >= 0; i--) {
    const wk = addDays(curWeek, -7 * i);
    const s = range(wk, addDays(wk, 6) > today ? today : addDays(wk, 6))
      .map((k) => S.globalDayScore(habits, entries, k, today, weekStart))
      .filter((x) => x != null);
    weeks.push({ week: wk, value: s.length ? s.reduce((a, b) => a + b, 0) / s.length : null });
  }
  root.append(
    h(
      'section.card',
      h('div.card-head', h('h2', 'Tendance par semaine'), h('span.muted.small', '12 semaines')),
      barChart({
        data: weeks,
        color: 'var(--accent)',
        format: (t) => `${Math.round(t * 100)}%`,
        labelFor: (d, i) => (i % 3 === 2 || i === weeks.length - 1 ? formatShort(d.week).replace('.', '') : ''),
        tipFor: (d) => `<strong>Semaine du ${formatShort(d.week)}</strong><br>${d.value == null ? 'Pas de données' : `${Math.round(d.value * 100)} % de réussite`}`,
      }),
    ),
  );

  // --- Classement des habitudes
  const ranked = habits
    .map((hb) => ({ hb, r: S.completionRate(hb, entries[hb.id] || {}, from, today, today, weekStart) }))
    .sort((a, b) => (b.r.rate ?? -1) - (a.r.rate ?? -1));
  root.append(
    h(
      'section.card',
      h('div.card-head', h('h2', 'Par habitude'), h('span.muted.small', `${PERIODS.find((p) => p.id === period).label}`)),
      h(
        'ul.rank-list',
        ranked.map(({ hb, r }) =>
          h(
            'li',
            { onclick: () => nav.go(`#/habit/${hb.id}`), style: { '--c': hb.color } },
            h('span.rank-icon', hb.icon),
            h('div.rank-body', h('div.rank-top', h('span', hb.name), h('strong', percent(r.rate))), h('div.wd-track', h('div.wd-fill', { style: { width: `${(r.rate || 0) * 100}%` } }))),
          ),
        ),
      ),
    ),
  );
}
