// Feuille de saisie d'une journée : valeur, humeur et note.
import { h, icon, openSheet, toast, formatNumber } from '../ui.js';
import { relativeDay, formatFull, todayKey } from '../dates.js';
import * as store from '../store.js';

export const MOODS = [
  { v: 1, e: '😞', l: 'Difficile' },
  { v: 2, e: '😕', l: 'Bof' },
  { v: 3, e: '😐', l: 'Neutre' },
  { v: 4, e: '🙂', l: 'Bien' },
  { v: 5, e: '😄', l: 'Super' },
];

export const moodEmoji = (v) => MOODS.find((m) => m.v === v)?.e || '';

export function openEntrySheet(habit, key) {
  const existing = store.getEntries(habit.id)[key] || {};
  const draft = { value: existing.value || 0, note: existing.note || '', mood: existing.mood || 0 };

  const sheet = openSheet({
    title: `${habit.icon} ${habit.name}`,
    content: () => render(),
  });

  function rerender() {
    sheet.setContent(render());
  }

  function valueControl() {
    switch (habit.type) {
      case 'quantity':
        return h(
          'div.field',
          h('label', `Quantité (objectif ${formatNumber(habit.target)} ${habit.unit})`),
          h(
            'div.stepper.large',
            h('button.icon-btn', { type: 'button', 'aria-label': 'Moins', onclick: () => ((draft.value = Math.max(0, draft.value - habit.step)), rerender()) }, icon('minus')),
            h('input.input.center', {
              type: 'number',
              min: 0,
              step: 'any',
              value: draft.value,
              inputMode: 'decimal',
              oninput: (e) => (draft.value = Math.max(0, Number(e.target.value) || 0)),
            }),
            h('button.icon-btn', { type: 'button', 'aria-label': 'Plus', onclick: () => ((draft.value += habit.step), rerender()) }, icon('plus')),
          ),
        );
      case 'quit':
        return h(
          'div.field',
          h('label', 'Cette journée'),
          h(
            'div.segmented',
            h('button', { type: 'button', class: draft.value < 1 ? 'selected' : '', onclick: () => ((draft.value = 0), rerender()) }, '✅ Tenu bon'),
            h('button', { type: 'button', class: draft.value >= 1 ? 'selected danger' : '', onclick: () => ((draft.value = 1), rerender()) }, '↩️ Rechute'),
          ),
        );
      default:
        return h(
          'div.field',
          h('label', 'Cette journée'),
          h(
            'div.segmented',
            h('button', { type: 'button', class: draft.value >= 1 ? 'selected' : '', onclick: () => ((draft.value = 1), rerender()) }, '✅ Fait'),
            h('button', { type: 'button', class: draft.value < 1 ? 'selected' : '', onclick: () => ((draft.value = 0), rerender()) }, 'Pas fait'),
          ),
        );
    }
  }

  function render() {
    return h(
      'form.stack',
      {
        onsubmit: (e) => {
          e.preventDefault();
          store.setEntry(habit.id, key, { value: draft.value, note: draft.note.trim(), mood: draft.mood });
          toast('Journée enregistrée');
          sheet.close();
        },
      },
      h('p.muted.entry-date', key === todayKey() ? `Aujourd'hui · ${formatFull(key)}` : `${relativeDay(key)} · ${formatFull(key)}`),
      valueControl(),
      h(
        'div.field',
        h('label', 'Humeur'),
        h(
          'div.mood-row',
          MOODS.map((m) =>
            h(
              'button.mood',
              {
                type: 'button',
                class: draft.mood === m.v ? 'selected' : '',
                'aria-label': m.l,
                title: m.l,
                onclick: () => {
                  draft.mood = draft.mood === m.v ? 0 : m.v;
                  rerender();
                },
              },
              h('span', m.e),
              h('small', m.l),
            ),
          ),
        ),
      ),
      h(
        'div.field',
        h('label', 'Note'),
        h('textarea.input', {
          rows: 3,
          maxLength: 500,
          placeholder: habit.type === 'quit' ? 'Ce qui a aidé, ou déclenché l’envie…' : 'Comment ça s’est passé ?',
          value: draft.note,
          oninput: (e) => (draft.note = e.target.value),
        }),
      ),
      h('div.row.end', h('button.btn.ghost', { type: 'button', onclick: () => sheet.close() }, 'Annuler'), h('button.btn.primary', { type: 'submit' }, 'Enregistrer')),
    );
  }
}
