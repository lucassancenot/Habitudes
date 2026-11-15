// Écran « Aujourd'hui » : la liste des habitudes du jour et leur saisie rapide.
import { h, icon, toast, vibrate, celebrate, formatNumber } from '../ui.js';
import { addDays, todayKey, relativeDay, formatFull, startOfWeek, weekdayShort, fromKey } from '../dates.js';
import * as store from '../store.js';
import * as S from '../stats.js';
import { ring, miniRing } from '../charts.js';
import { openEntrySheet, moodEmoji } from './entry.js';
import { openHabitForm } from './form.js';
import { loadDemo } from '../demo.js';

let selectedDay = null;
let lastRate = null;

export function renderToday(root, params, nav) {
  const today = todayKey();
  if (!selectedDay || selectedDay > today) selectedDay = today;
  const day = selectedDay;
  const { weekStart, showBenefitOnToday } = store.getSettings();
  const all = store.activeHabits();

  // --- En-tête
  root.append(
    h(
      'header.page-header',
      h('div', h('p.eyebrow', relativeDay(day, today) === "Aujourd'hui" ? greeting() : relativeDay(day, today)), h('h1', capitalize(formatFull(day)))),
      day !== today && h('button.btn.secondary.small', { onclick: () => ((selectedDay = today), nav.refresh()) }, "Aujourd'hui"),
    ),
  );

  root.append(weekStrip(day, today, weekStart, nav));

  if (!all.length) {
    root.append(emptyState(nav));
    return;
  }

  const due = all.filter((hb) => S.isDueOn(hb, store.getEntries(hb.id), day, weekStart));
  const doneCount = due.filter((hb) => S.countsAsDoneOn(hb, store.getEntries(hb.id), day, weekStart)).length;
  const rate = due.length ? doneCount / due.length : 0;

  if (day === today && lastRate != null && lastRate < 1 && rate === 1 && due.length) {
    celebrate(due.map((x) => x.color));
    toast('🎉 Journée parfaite ! Toutes tes habitudes sont faites.');
  }
  if (day === today) lastRate = rate;

  // --- Résumé
  root.append(
    h(
      'section.card.summary',
      ring({ value: rate, size: 108, stroke: 10, label: `${doneCount}/${due.length}`, sublabel: 'faites' }),
      h(
        'div.summary-text',
        h('h2', summaryTitle(rate, due.length)),
        h('p.muted', summarySub(due, day, weekStart)),
      ),
    ),
  );

  if (showBenefitOnToday && day === today) {
    const b = benefitOfTheDay(all, today);
    if (b) {
      root.append(
        h(
          'section.card.benefit-of-day',
          { style: { '--c': b.habit.color }, onclick: () => nav.go(`#/habit/${b.habit.id}`) },
          h('span.bod-icon', b.habit.icon),
          h('div', h('p.eyebrow', `Pourquoi « ${b.habit.name} » ?`), h('p', b.text)),
        ),
      );
    }
  }

  // --- Liste
  const list = h('section.habit-list');
  const notDue = all.filter((hb) => !due.includes(hb));
  for (const hb of due) list.append(habitCard(hb, day, weekStart, nav));
  root.append(list);

  if (notDue.length) {
    root.append(
      h(
        'details.not-due',
        h('summary', `Pas prévues ce jour (${notDue.length})`),
        h('div.habit-list', notDue.map((hb) => habitCard(hb, day, weekStart, nav))),
      ),
    );
  }

  root.append(h('button.fab', { 'aria-label': 'Nouvelle habitude', onclick: () => openHabitForm() }, icon('plus', 26)));
}

function greeting() {
  const hr = new Date().getHours();
  if (hr < 5) return 'Bonne nuit';
  if (hr < 12) return 'Bonjour';
  if (hr < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function summaryTitle(rate, n) {
  if (!n) return 'Rien de prévu';
  if (rate >= 1) return 'Journée parfaite 🎉';
  if (rate >= 0.66) return 'Presque fini !';
  if (rate >= 0.33) return 'Bien parti';
  if (rate > 0) return "C'est lancé";
  return "C'est parti !";
}

function summarySub(due, day, weekStart) {
  const left = due.filter((hb) => !S.countsAsDoneOn(hb, store.getEntries(hb.id), day, weekStart));
  if (!due.length) return 'Profite de ta journée.';
  if (!left.length) return 'Tout est fait. Bravo !';
  const names = left.slice(0, 2).map((x) => x.name.toLowerCase());
  return `Reste : ${names.join(', ')}${left.length > 2 ? ` et ${left.length - 2} autre${left.length > 3 ? 's' : ''}` : ''}.`;
}

/** Un bienfait différent chaque jour, choisi de façon stable. */
function benefitOfTheDay(habits, today) {
  const pool = [];
  for (const hb of habits) for (const b of hb.benefits) pool.push({ habit: hb, text: b.text });
  if (!pool.length) return null;
  let hash = 0;
  for (const c of today) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return pool[hash % pool.length];
}

function weekStrip(day, today, weekStart, nav) {
  const ws = startOfWeek(day, weekStart);
  const habits = store.getState().habits;
  const entries = store.getState().entries;
  const days = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(ws, i));
  const nextWeek = addDays(ws, 7);
  return h(
    'nav.week-strip',
    { 'aria-label': 'Choisir un jour' },
    h('button.icon-btn', { 'aria-label': 'Semaine précédente', onclick: () => ((selectedDay = addDays(day, -7)), nav.refresh()) }, icon('left', 18)),
    h(
      'div.week-days',
      days.map((k) => {
        const score = k <= today ? S.globalDayScore(habits, entries, k, today, weekStart) : null;
        return h(
          'button.week-day',
          {
            class: [k === day ? 'selected' : '', k === today ? 'is-today' : '', k > today ? 'future' : ''].join(' '),
            disabled: k > today,
            onclick: () => ((selectedDay = k), nav.refresh()),
            'aria-label': relativeDay(k, today),
          },
          h('small', weekdayShort(k)),
          h('strong', String(fromKey(k).getDate())),
          h('i.day-dot', { style: { '--p': score == null ? 0 : score }, class: score == null ? 'none' : score >= 1 ? 'full' : '' }),
        );
      }),
    ),
    h(
      'button.icon-btn',
      {
        'aria-label': 'Semaine suivante',
        disabled: nextWeek > today,
        onclick: () => ((selectedDay = addDays(day, 7) > today ? today : addDays(day, 7)), nav.refresh()),
      },
      icon('right', 18),
    ),
  );
}

export function habitCard(hb, day, weekStart, nav) {
  const entries = store.getEntries(hb.id);
  const entry = entries[day] || {};
  const v = entry.value || 0;
  const today = todayKey();
  const progress = S.dayProgress(hb, entries, day);
  const streak = S.currentStreak(hb, entries, day > today ? today : day, weekStart);

  let subtitle;
  let ringValue = progress;
  switch (hb.type) {
    case 'quantity':
      subtitle = `${formatNumber(v)} / ${formatNumber(hb.target)} ${hb.unit}`;
      break;
    case 'weekly': {
      const c = S.weekCount(hb, entries, startOfWeek(day, weekStart));
      const t = S.weekTarget(hb);
      subtitle = `${c} / ${t} cette semaine`;
      ringValue = Math.min(c / t, 1);
      break;
    }
    case 'quit':
      subtitle = v >= 1 ? 'Rechute ce jour-là' : `${streak} jour${streak > 1 ? 's' : ''} sans`;
      ringValue = v >= 1 ? 0 : 1;
      break;
    default:
      subtitle = progress >= 1 ? 'Fait' : 'À faire';
  }

  const done = progress >= 1;
  const actions = h('div.card-actions');

  if (hb.type === 'quantity') {
    actions.append(
      h(
        'div.stepper',
        h(
          'button.icon-btn',
          {
            'aria-label': `Retirer ${hb.step}`,
            disabled: v <= 0,
            onclick: (e) => {
              e.stopPropagation();
              store.increment(hb.id, day, -hb.step);
            },
          },
          icon('minus', 18),
        ),
        h(
          'button.icon-btn.primary-soft',
          {
            'aria-label': `Ajouter ${hb.step}`,
            style: { '--c': hb.color },
            onclick: (e) => {
              e.stopPropagation();
              vibrate();
              store.increment(hb.id, day, hb.step);
            },
          },
          icon('plus', 18),
        ),
      ),
    );
  } else if (hb.type === 'quit') {
    actions.append(
      h(
        'button.btn.small',
        {
          class: v >= 1 ? 'secondary' : 'ghost danger-text',
          onclick: (e) => {
            e.stopPropagation();
            if (v >= 1) {
              store.setEntry(hb.id, day, { value: 0 });
            } else {
              const prev = streak;
              store.setEntry(hb.id, day, { value: 1 });
              toast(prev > 1 ? `Pas grave : ${prev} jours, c'est déjà une belle série. On repart !` : 'Pas grave, on repart !', {
                action: 'Annuler',
                onAction: () => store.setEntry(hb.id, day, { value: 0 }),
                duration: 5000,
              });
            }
          },
        },
        v >= 1 ? 'Annuler' : 'Rechute',
      ),
    );
  } else {
    actions.append(
      h(
        'button.check-btn',
        {
          class: done ? 'done' : '',
          style: { '--c': hb.color },
          'aria-label': done ? 'Marquer comme non fait' : 'Marquer comme fait',
          'aria-pressed': done ? 'true' : 'false',
          onclick: (e) => {
            e.stopPropagation();
            vibrate(done ? 5 : 15);
            store.toggleDone(hb.id, day);
          },
        },
        icon('check', 22),
      ),
    );
  }

  actions.append(
    h(
      'button.icon-btn.note-btn',
      {
        class: entry.note || entry.mood ? 'has-note' : '',
        'aria-label': 'Note et humeur',
        onclick: (e) => {
          e.stopPropagation();
          openEntrySheet(hb, day);
        },
      },
      entry.mood ? h('span.mood-mini', moodEmoji(entry.mood)) : icon('note', 18),
    ),
  );

  const showStreak = hb.type !== 'quit' && streak > 0;

  return h(
    'article.habit-card',
    {
      class: done ? 'is-done' : '',
      style: { '--c': hb.color },
      onclick: () => nav.go(`#/habit/${hb.id}`),
      tabIndex: 0,
      onkeydown: (e) => e.key === 'Enter' && e.target === e.currentTarget && nav.go(`#/habit/${hb.id}`),
    },
    miniRing(ringValue, hb.color, hb.icon),
    h(
      'div.habit-info',
      h('h3', hb.name),
      h(
        'p.habit-sub',
        h('span', subtitle),
        showStreak && h('span.streak', icon('flame', 14), `${streak} ${S.streakUnit(hb, streak).replace('semaines', 'sem.').replace('semaine', 'sem.')}`),
        entry.note && h('span.note-preview', `« ${entry.note} »`),
      ),
    ),
    actions,
  );
}

function emptyState(nav) {
  return h(
    'section.empty',
    h('div.empty-art', '🌱'),
    h('h2', 'Bienvenue dans Habitudes'),
    h('p.muted', 'Crée ta première habitude : choisis un modèle (avec ses bienfaits) ou invente la tienne.'),
    h('button.btn.primary', { onclick: () => openHabitForm() }, icon('plus', 18), 'Créer une habitude'),
    h(
      'button.btn.ghost',
      {
        onclick: () => {
          loadDemo();
          toast('Données de démonstration chargées');
        },
      },
      'Essayer avec des exemples',
    ),
  );
}
