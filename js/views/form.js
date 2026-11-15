// Formulaire de création / modification d'une habitude.
import { h, icon, openSheet, toast, clear } from '../ui.js';
import { TEMPLATES, CATEGORIES, COLORS, ICONS, findTemplate, suggestBenefits } from '../templates.js';
import { TYPES } from '../stats.js';
import { DAY_LABELS, todayKey } from '../dates.js';
import * as store from '../store.js';
import { ensureNotificationPermission } from '../reminders.js';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function openHabitForm({ habit = null, onSaved } = {}) {
  const isNew = !habit;
  const draft = habit
    ? structuredClone(habit)
    : store.normalizeHabit({ name: '', icon: '✅', color: COLORS[0], type: 'check', benefits: [], createdAt: todayKey() });
  if (isNew) draft.name = '';

  const sheet = openSheet({
    title: isNew ? 'Nouvelle habitude' : "Modifier l'habitude",
    wide: true,
    content: () => render(),
  });

  function rerender() {
    const scroll = sheet.body.scrollTop;
    sheet.setContent(render());
    sheet.body.scrollTop = scroll;
  }

  function applyTemplate(t) {
    Object.assign(draft, {
      name: t.name,
      icon: t.icon,
      color: t.color,
      type: t.type,
      target: t.target || draft.target,
      unit: t.unit || '',
      timesPerWeek: t.timesPerWeek || draft.timesPerWeek,
      benefits: t.benefits.map((text) => ({ id: store.uid(), text })),
    });
    rerender();
  }

  function render() {
    const form = h('form.stack.habit-form', {
      onsubmit: (e) => {
        e.preventDefault();
        save();
      },
    });

    // --- Modèles
    if (isNew) {
      form.append(templatePicker(applyTemplate));
    }

    // --- Nom + icône + couleur
    const nameInput = h('input.input', {
      value: draft.name,
      placeholder: 'Ex. : Méditer, Lire, Boire de l\'eau…',
      required: true,
      maxLength: 60,
      autofocus: isNew,
      oninput: (e) => {
        draft.name = e.target.value;
        updateSuggestion();
      },
    });
    const suggestionSlot = h('div');
    function updateSuggestion() {
      clear(suggestionSlot);
      const t = findTemplate(draft.name);
      if (!t) return;
      const existing = new Set(draft.benefits.map((b) => b.text));
      const missing = t.benefits.filter((b) => !existing.has(b));
      if (!missing.length) return;
      suggestionSlot.append(
        h(
          'button.suggest-chip',
          {
            type: 'button',
            onclick: () => {
              draft.name = draft.name || t.name;
              for (const text of missing) draft.benefits.push({ id: store.uid(), text });
              if (draft.icon === '✅') draft.icon = t.icon;
              rerender();
              toast(`${missing.length} bienfait${missing.length > 1 ? 's' : ''} ajouté${missing.length > 1 ? 's' : ''}`);
            },
          },
          icon('sparkle', 16),
          ` Ajouter ${missing.length} bienfait${missing.length > 1 ? 's' : ''} suggéré${missing.length > 1 ? 's' : ''}`,
        ),
      );
    }
    updateSuggestion();

    form.append(
      h(
        'div.field',
        h('label', 'Nom'),
        h(
          'div.name-row',
          h('button.icon-preview', { type: 'button', style: { background: draft.color }, onclick: () => pickIcon(), 'aria-label': "Changer l'icône" }, draft.icon),
          nameInput,
        ),
        suggestionSlot,
      ),
    );

    form.append(
      h(
        'div.field',
        h('label', 'Couleur'),
        h(
          'div.color-row',
          COLORS.map((c) =>
            h('button.color-dot', {
              type: 'button',
              style: { background: c },
              class: c === draft.color ? 'selected' : '',
              'aria-label': `Couleur ${c}`,
              onclick: () => {
                draft.color = c;
                rerender();
              },
            }),
          ),
        ),
      ),
    );

    // --- Type
    form.append(
      h(
        'div.field',
        h('label', 'Type de suivi'),
        h(
          'div.type-grid',
          Object.entries(TYPES).map(([key, t]) =>
            h(
              'button.type-option',
              {
                type: 'button',
                class: draft.type === key ? 'selected' : '',
                onclick: () => {
                  draft.type = key;
                  rerender();
                },
              },
              h('strong', t.label),
              h('small', t.hint),
            ),
          ),
        ),
      ),
    );

    // --- Options selon le type
    if (draft.type === 'quantity') {
      form.append(
        h(
          'div.field-row',
          h('div.field', h('label', 'Objectif / jour'), h('input.input', { type: 'number', min: 0.1, step: 'any', value: draft.target, required: true, oninput: (e) => (draft.target = Number(e.target.value)) })),
          h('div.field', h('label', 'Unité'), h('input.input', { value: draft.unit, placeholder: 'verres, min, pages…', maxLength: 20, oninput: (e) => (draft.unit = e.target.value) })),
          h('div.field', h('label', 'Pas du bouton +'), h('input.input', { type: 'number', min: 0.1, step: 'any', value: draft.step, oninput: (e) => (draft.step = Number(e.target.value)) })),
        ),
      );
    }

    if (draft.type === 'check' || draft.type === 'quantity') {
      form.append(
        h(
          'div.field',
          h('label', 'Jours prévus'),
          h(
            'div.day-toggles',
            WEEK_ORDER.map((d) =>
              h(
                'button.day-toggle',
                {
                  type: 'button',
                  class: draft.days.includes(d) ? 'selected' : '',
                  'aria-pressed': draft.days.includes(d) ? 'true' : 'false',
                  onclick: () => {
                    if (draft.days.includes(d)) {
                      if (draft.days.length > 1) draft.days = draft.days.filter((x) => x !== d);
                    } else draft.days = [...draft.days, d].sort();
                    rerender();
                  },
                },
                DAY_LABELS[d],
              ),
            ),
          ),
          h('small.muted', draft.days.length === 7 ? 'Tous les jours' : `${draft.days.length} jour${draft.days.length > 1 ? 's' : ''} par semaine`),
        ),
      );
    }

    if (draft.type === 'weekly') {
      form.append(
        h(
          'div.field',
          h('label', 'Combien de fois par semaine ?'),
          h(
            'div.day-toggles',
            [1, 2, 3, 4, 5, 6, 7].map((n) =>
              h(
                'button.day-toggle',
                {
                  type: 'button',
                  class: draft.timesPerWeek === n ? 'selected' : '',
                  onclick: () => {
                    draft.timesPerWeek = n;
                    rerender();
                  },
                },
                String(n),
              ),
            ),
          ),
        ),
      );
    }

    form.append(
      h(
        'div.field',
        h('label', draft.type === 'quit' ? "Arrêté depuis le" : 'Début du suivi'),
        h('input.input', { type: 'date', value: draft.createdAt, max: todayKey(), required: true, onchange: (e) => (draft.createdAt = e.target.value || todayKey()) }),
        draft.type === 'quit' && h('small.muted', 'Chaque jour sans rechute compte comme une réussite.'),
      ),
    );

    // --- Motivation
    form.append(
      h(
        'div.field',
        h('label', 'Pourquoi cette habitude ? (facultatif)'),
        h('textarea.input', { rows: 2, maxLength: 280, placeholder: 'Ce qui me motive vraiment…', value: draft.motivation, oninput: (e) => (draft.motivation = e.target.value) }),
      ),
    );

    // --- Bienfaits
    form.append(benefitsEditor(draft, rerender));

    // --- Rappel
    form.append(
      h(
        'div.field',
        h('label', 'Rappel'),
        h(
          'div.row',
          h(
            'label.switch',
            h('input', {
              type: 'checkbox',
              checked: draft.reminder.enabled,
              onchange: async (e) => {
                draft.reminder.enabled = e.target.checked;
                if (e.target.checked) await ensureNotificationPermission();
                rerender();
              },
            }),
            h('span.slider'),
          ),
          h('span', draft.reminder.enabled ? 'Activé à' : 'Désactivé'),
          draft.reminder.enabled && h('input.input.time', { type: 'time', value: draft.reminder.time, onchange: (e) => (draft.reminder.time = e.target.value || '09:00') }),
        ),
      ),
    );

    form.append(
      h(
        'div.row.end.sticky-actions',
        h('button.btn.ghost', { type: 'button', onclick: () => sheet.close() }, 'Annuler'),
        h('button.btn.primary', { type: 'submit' }, isNew ? "Créer l'habitude" : 'Enregistrer'),
      ),
    );
    return form;
  }

  function pickIcon() {
    const picker = openSheet({
      title: 'Choisir une icône',
      content: h(
        'div.stack',
        h(
          'div.icon-grid',
          ICONS.map((ic) =>
            h(
              'button.icon-choice',
              {
                type: 'button',
                class: ic === draft.icon ? 'selected' : '',
                onclick: () => {
                  draft.icon = ic;
                  picker.close();
                  rerender();
                },
              },
              ic,
            ),
          ),
        ),
        h(
          'div.field',
          h('label', 'Ou tape n’importe quel emoji'),
          h('input.input', {
            maxLength: 4,
            placeholder: '🙂',
            onchange: (e) => {
              const v = [...e.target.value.trim()].slice(0, 2).join('');
              if (v) {
                draft.icon = v;
                picker.close();
                rerender();
              }
            },
          }),
        ),
      ),
    });
  }

  function save() {
    const name = draft.name.trim();
    if (!name) return toast('Donne un nom à ton habitude');
    if (draft.type === 'quantity' && !(draft.target > 0)) return toast("L'objectif doit être supérieur à 0");
    const data = { ...draft, name, benefits: draft.benefits.filter((b) => b.text.trim()) };
    let saved;
    if (isNew) {
      saved = store.addHabit(data);
      toast(`${saved.icon} « ${saved.name} » créée`);
    } else {
      store.updateHabit(habit.id, data);
      saved = store.getHabit(habit.id);
      toast('Modifications enregistrées');
    }
    sheet.close();
    onSaved && onSaved(saved);
  }
}

function templatePicker(onPick) {
  let cat = CATEGORIES[0];
  const list = h('div.template-list');
  const tabs = h('div.chip-row');
  function draw() {
    clear(tabs);
    clear(list);
    for (const c of CATEGORIES) {
      tabs.append(
        h(
          'button.chip',
          {
            type: 'button',
            class: c === cat ? 'selected' : '',
            onclick: () => {
              cat = c;
              draw();
            },
          },
          c,
        ),
      );
    }
    for (const t of TEMPLATES.filter((x) => x.category === cat)) {
      list.append(
        h(
          'button.template',
          { type: 'button', style: { '--c': t.color }, onclick: () => onPick(t) },
          h('span.template-icon', t.icon),
          h('span.template-name', t.name),
        ),
      );
    }
  }
  draw();
  return h('details.templates', { open: true }, h('summary', h('span', 'Partir d’un modèle'), h('small.muted', ' — bienfaits inclus')), tabs, list);
}

/** Éditeur de liste de bienfaits (dans le formulaire). */
function benefitsEditor(draft, rerender) {
  const input = h('input.input', {
    placeholder: 'Ajouter un bienfait…',
    maxLength: 140,
    onkeydown: (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        add();
      }
    },
  });
  function add() {
    const v = input.value.trim();
    if (!v) return;
    draft.benefits.push({ id: store.uid(), text: v });
    rerender();
  }
  const suggestions = suggestBenefits(draft.name).filter((s) => !draft.benefits.some((b) => b.text === s));

  return h(
    'div.field',
    h('label', `Bienfaits (${draft.benefits.length})`),
    h(
      'ul.benefit-edit-list',
      draft.benefits.map((b) =>
        h(
          'li',
          h('span.benefit-bullet', { style: { background: draft.color } }),
          h('input.input.inline', { value: b.text, maxLength: 140, oninput: (e) => (b.text = e.target.value) }),
          h(
            'button.icon-btn.small',
            {
              type: 'button',
              'aria-label': 'Supprimer ce bienfait',
              onclick: () => {
                draft.benefits = draft.benefits.filter((x) => x.id !== b.id);
                rerender();
              },
            },
            icon('x', 16),
          ),
        ),
      ),
    ),
    h('div.add-row', input, h('button.btn.secondary', { type: 'button', onclick: add }, icon('plus', 18), 'Ajouter')),
    suggestions.length > 0 &&
      h(
        'div.suggestions',
        h('small.muted', 'Suggestions :'),
        suggestions.map((s) =>
          h(
            'button.suggest-chip.small',
            {
              type: 'button',
              onclick: () => {
                draft.benefits.push({ id: store.uid(), text: s });
                rerender();
              },
            },
            '+ ',
            s,
          ),
        ),
      ),
  );
}
