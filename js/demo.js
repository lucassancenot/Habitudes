// Données de démonstration : quelques habitudes avec ~4 mois d'historique.
import { addDays, todayKey, dayOfWeek } from './dates.js';
import { TEMPLATES } from './templates.js';
import * as store from './store.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const NOTES = ['Super séance', 'Difficile de m’y mettre', 'Fait tôt le matin', 'Avec un ami', 'Très bonne énergie', 'Un peu fatigué', 'Fier de moi'];

export function buildDemoState() {
  const today = todayKey();
  const rand = rng(42);
  const pick = (name) => TEMPLATES.find((t) => t.name === name);
  const specs = [
    { t: pick("Boire de l'eau"), days: 120, p: 0.75 },
    { t: pick('Méditer'), days: 95, p: 0.65, reminder: '08:00' },
    { t: pick('Faire du sport'), days: 120, p: 0.5 },
    { t: pick('Lire'), days: 60, p: 0.7, reminder: '21:30' },
    { t: pick('Écrire son journal'), days: 45, p: 0.6, weekdays: [1, 2, 3, 4, 5] },
    { t: pick('Pas de réseaux sociaux'), days: 50, slips: 3 },
  ];

  const habits = [];
  const entries = {};
  specs.forEach((spec, i) => {
    const { t } = spec;
    const id = store.uid();
    const createdAt = addDays(today, -spec.days);
    habits.push(
      store.normalizeHabit({
        id,
        name: t.name,
        icon: t.icon,
        color: t.color,
        type: t.type,
        target: t.target,
        unit: t.unit,
        timesPerWeek: t.timesPerWeek,
        days: spec.weekdays,
        benefits: t.benefits,
        createdAt,
        order: i,
        reminder: { enabled: !!spec.reminder, time: spec.reminder || '09:00' },
      }),
    );
    const map = (entries[id] = {});
    let momentum = 0;
    for (let d = spec.days; d >= 0; d--) {
      const k = addDays(today, -d);
      // Progression : on s'améliore avec le temps.
      const p = Math.min(0.95, (spec.p || 0) + (1 - d / spec.days) * 0.2 + momentum);
      if (t.type === 'quit') continue;
      if (spec.weekdays && !spec.weekdays.includes(dayOfWeek(k))) continue;
      if (d === 0 && rand() < 0.5) continue; // aujourd'hui : partiellement fait
      if (t.type === 'weekly') {
        if (rand() < (t.timesPerWeek / 7) * 1.15 * (p + 0.2)) map[k] = { value: 1 };
        continue;
      }
      const ok = rand() < p;
      momentum = ok ? Math.min(0.1, momentum + 0.02) : Math.max(-0.1, momentum - 0.05);
      if (t.type === 'quantity') {
        const v = ok ? t.target + Math.floor(rand() * 3) : Math.floor(rand() * t.target);
        if (v > 0) map[k] = { value: v };
      } else if (ok) map[k] = { value: 1 };
      if (map[k] && rand() < 0.12) {
        map[k].note = NOTES[Math.floor(rand() * NOTES.length)];
        map[k].mood = 3 + Math.floor(rand() * 3);
      }
    }
    if (t.type === 'quit') {
      for (let s = 0; s < spec.slips; s++) {
        const k = addDays(today, -Math.floor(10 + rand() * (spec.days - 10)));
        map[k] = { value: 1, note: s === 0 ? 'Soirée ennuyeuse, j’ai craqué' : undefined };
      }
    }
  });

  return { habits, entries, settings: store.getSettings() };
}

export function loadDemo() {
  store.replaceState({ ...store.getState(), ...buildDemoState() });
}
