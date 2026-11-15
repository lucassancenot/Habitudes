// Écran « Habitudes » : gérer, réordonner, archiver.
import { h, icon, percent } from '../ui.js';
import { addDays, todayKey } from '../dates.js';
import * as store from '../store.js';
import * as S from '../stats.js';
import { openHabitForm } from './form.js';

export function renderHabits(root, params, nav) {
  const today = todayKey();
  const { weekStart } = store.getSettings();
  const active = store.activeHabits();
  const archived = store.archivedHabits();

  root.append(
    h(
      'header.page-header',
      h('div', h('p.eyebrow', `${active.length} active${active.length > 1 ? 's' : ''}`), h('h1', 'Mes habitudes')),
      h('button.btn.primary.small', { onclick: () => openHabitForm({ onSaved: (hb) => nav.go(`#/habit/${hb.id}`) }) }, icon('plus', 18), 'Nouvelle'),
    ),
  );

  if (!active.length && !archived.length) {
    root.append(
      h('section.empty', h('div.empty-art', '📋'), h('h2', 'Aucune habitude'), h('p.muted', 'Commence par en créer une.'), h('button.btn.primary', { onclick: () => openHabitForm() }, 'Créer une habitude')),
    );
    return;
  }

  const row = (hb, i, list, isArchived) => {
    const entries = store.getEntries(hb.id);
    const streak = S.currentStreak(hb, entries, today, weekStart);
    const r30 = S.completionRate(hb, entries, addDays(today, -29), today, today, weekStart);
    return h(
      'li.manage-row',
      { style: { '--c': hb.color } },
      h(
        'button.manage-main',
        { onclick: () => nav.go(`#/habit/${hb.id}`) },
        h('span.detail-icon.small', { style: { background: hb.color } }, hb.icon),
        h(
          'span.manage-text',
          h('strong', hb.name),
          h('small.muted', `${S.TYPES[hb.type].label} · ${streak} ${S.streakUnit(hb, streak)} de série · ${percent(r30.rate)} sur 30 j · ${hb.benefits.length} bienfait${hb.benefits.length > 1 ? 's' : ''}`),
        ),
      ),
      !isArchived &&
        h(
          'span.reorder',
          h('button.icon-btn.small', { 'aria-label': 'Monter', disabled: i === 0, onclick: () => store.moveHabit(hb.id, -1) }, icon('up', 16)),
          h('button.icon-btn.small', { 'aria-label': 'Descendre', disabled: i === list.length - 1, onclick: () => store.moveHabit(hb.id, 1) }, icon('down', 16)),
        ),
      isArchived && h('button.btn.small.secondary', { onclick: () => store.setArchived(hb.id, false) }, 'Restaurer'),
    );
  };

  root.append(h('ul.manage-list.card', active.map((hb, i) => row(hb, i, active, false))));

  if (archived.length) {
    root.append(h('h2.section-title', icon('archive', 18), ` Archivées (${archived.length})`));
    root.append(h('ul.manage-list.card.archived', archived.map((hb, i) => row(hb, i, archived, true))));
  }
}
