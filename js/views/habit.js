// Écran de détail d'une habitude : progression, graphiques, bienfaits et journal.
import { h, icon, toast, confirmDialog, openSheet, percent, formatNumber, downloadFile, clear } from '../ui.js';
import { addDays, todayKey, formatFull, formatShort, relativeDay, DAY_LABELS, diffDays } from '../dates.js';
import * as store from '../store.js';
import * as S from '../stats.js';
import { heatmap, heatmapLegend, barChart, lineChart } from '../charts.js';
import { openEntrySheet, moodEmoji } from './entry.js';
import { openHabitForm } from './form.js';
import { suggestBenefits } from '../templates.js';
import { buildICS } from '../reminders.js';

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function renderHabit(root, { id }, nav) {
  const hb = store.getHabit(id);
  if (!hb) {
    root.append(h('section.empty', h('h2', 'Habitude introuvable'), h('button.btn.primary', { onclick: () => nav.go('#/') }, 'Retour')));
    return;
  }
  const entries = store.getEntries(id);
  const today = todayKey();
  const { weekStart } = store.getSettings();

  root.style.setProperty('--c', hb.color);

  // --- En-tête
  root.append(
    h(
      'header.detail-header',
      h('button.icon-btn', { 'aria-label': 'Retour', onclick: () => nav.back() }, icon('back')),
      h('div.detail-title', h('span.detail-icon', { style: { background: hb.color } }, hb.icon), h('div', h('h1', hb.name), h('p.muted', typeLine(hb)))),
      h('button.icon-btn', { 'aria-label': 'Modifier', onclick: () => openHabitForm({ habit: hb }) }, icon('edit')),
      h('button.icon-btn', { 'aria-label': "Plus d'options", onclick: () => moreMenu(hb, nav) }, icon('more')),
    ),
  );

  if (hb.archived) {
    root.append(
      h('div.banner', icon('archive', 18), h('span', 'Cette habitude est archivée.'), h('button.btn.small.secondary', { onclick: () => store.setArchived(hb.id, false) }, 'Restaurer')),
    );
  }

  if (hb.motivation) root.append(h('blockquote.motivation', hb.motivation));

  // --- Chiffres clés
  root.append(statTiles(hb, entries, today, weekStart));

  // --- Calendrier
  const cal = h(
    'section.card',
    h('div.card-head', h('h2', 'Calendrier'), heatmapLegend(hb.color, hb.type === 'quit' ? ['Rechute', 'Tenu'] : ['Moins', 'Plus'])),
    heatmap({
      weeks: 26,
      today,
      weekStart,
      color: hb.color,
      cell: (k) => cellInfo(hb, entries, k, today),
      onSelect: (k) => openEntrySheet(hb, k),
    }),
    h('p.hint', 'Touche une case pour modifier ce jour-là (ajouter un oubli, une note…).'),
  );
  root.append(cal);

  // --- Graphiques
  root.append(chartsCard(hb, entries, today, weekStart));

  // --- Par jour de semaine
  const wd = hb.type !== 'weekly' && weekdayCard(hb, entries, today);
  if (wd) root.append(wd);

  // --- Bienfaits
  root.append(benefitsCard(hb));

  // --- Journal
  root.append(journalCard(hb, entries));
}

function typeLine(hb) {
  switch (hb.type) {
    case 'quantity':
      return `${formatNumber(hb.target)} ${hb.unit} par jour${daysSuffix(hb)}`;
    case 'weekly':
      return `${hb.timesPerWeek} fois par semaine`;
    case 'quit':
      return `À arrêter · depuis le ${formatFull(hb.createdAt)}`;
    default:
      return `Oui / non${daysSuffix(hb)}`;
  }
}

function daysSuffix(hb) {
  if (hb.days.length === 7) return ' · tous les jours';
  return ' · ' + WEEK_ORDER.filter((d) => hb.days.includes(d)).map((d) => DAY_LABELS[d].toLowerCase()).join(', ');
}

function tile(label, value, sub, iconName) {
  return h('div.stat-tile', h('p.stat-label', iconName && icon(iconName, 14), label), h('p.stat-value', value), sub && h('p.stat-sub', sub));
}

function statTiles(hb, entries, today, weekStart) {
  const cur = S.currentStreak(hb, entries, today, weekStart);
  const best = S.bestStreak(hb, entries, today, weekStart);
  const r30 = S.completionRate(hb, entries, addDays(today, -29), today, today, weekStart);
  const rAll = S.completionRate(hb, entries, '0000-01-01', today, today, weekStart);
  const tiles = [];

  if (hb.type === 'quit') {
    tiles.push(tile('Jours sans', formatNumber(cur), cur === best && cur > 0 ? 'Record actuel !' : `Record : ${best} j`, 'flame'));
    tiles.push(tile('Réussite', percent(rAll.rate), `${rAll.done} jours tenus`, 'trophy'));
    tiles.push(tile('Rechutes', formatNumber(S.totalSlips(entries)), 'depuis le début'));
    tiles.push(tile('Suivi depuis', formatNumber(diffDays(S.effectiveStart(hb, entries), today) + 1), 'jours'));
  } else {
    const unit = S.streakUnit(hb, cur);
    tiles.push(tile('Série actuelle', `${cur}`, unit + (cur > 0 && cur === best ? ' · record !' : ''), 'flame'));
    tiles.push(tile('Meilleure série', `${best}`, S.streakUnit(hb, best), 'trophy'));
    tiles.push(tile('30 derniers jours', percent(r30.rate), hb.type === 'weekly' ? `${r30.done}/${r30.total} semaines` : `${r30.done}/${r30.total} jours`));
    if (hb.type === 'quantity') {
      const sum30 = S.sumValues(entries, addDays(today, -29), today);
      tiles.push(tile('Moyenne / jour', formatNumber(Math.round((sum30 / 30) * 10) / 10), `${hb.unit} (30 j)`));
    } else {
      tiles.push(tile('Total', formatNumber(S.totalDone(hb, entries, today)), 'fois au total'));
    }
  }
  return h('section.stat-grid', tiles);
}

function cellInfo(hb, entries, k, today) {
  const st = S.dayStatus(hb, entries, k, today);
  const e = entries[k];
  const extra = [e?.mood ? moodEmoji(e.mood) : '', e?.note ? `« ${e.note} »` : ''].filter(Boolean).join(' ');
  const withExtra = (s) => (extra ? `${s} ${extra}` : s);
  if (st === 'before') return { level: null, label: 'Avant le début du suivi' };
  if (st === 'off') return { level: null, label: 'Jour non prévu', status: st };
  if (hb.type === 'quit') {
    return st === 'missed' ? { level: 0, status: 'missed', label: withExtra('Rechute') } : { level: 4, status: st, label: withExtra('Tenu bon') };
  }
  if (hb.type === 'quantity') {
    const p = S.dayProgress(hb, entries, k);
    const level = p >= 1 ? 4 : p >= 0.66 ? 3 : p >= 0.33 ? 2 : p > 0 ? 1 : 0;
    return { level, status: st, label: withExtra(`${formatNumber(e?.value || 0)} / ${formatNumber(hb.target)} ${hb.unit}`) };
  }
  if (st === 'done') return { level: 4, status: st, label: withExtra('Fait ✓') };
  if (st === 'pending') return { level: 0, status: st, label: 'Pas encore fait' };
  return { level: 0, status: hb.type === 'weekly' ? 'empty' : st, label: withExtra(hb.type === 'weekly' ? '—' : 'Pas fait') };
}

function chartsCard(hb, entries, today, weekStart) {
  const card = h('section.card');
  const weeks = S.weeklySeries(hb, entries, 12, today, weekStart);
  const bar = barChart({
    data: weeks.map((w) => ({ ...w, value: w.rate })),
    color: hb.color,
    format: (t) => `${Math.round(t * 100)}%`,
    labelFor: (d, i) => (i % 3 === 2 || i === weeks.length - 1 ? formatShort(d.week).replace('.', '') : ''),
    tipFor: (d) => {
      const head = `<strong>Semaine du ${formatShort(d.week)}</strong><br>`;
      if (d.value == null) return head + 'Pas encore suivie';
      if (hb.type === 'weekly') return head + `${d.count} / ${S.weekTarget(hb)} fois`;
      return head + `${Math.round(d.value * 100)} % de réussite`;
    },
  });

  if (hb.type === 'quantity') {
    const days = S.dailySeries(hb, entries, 30, today);
    card.append(
      h('div.card-head', h('h2', '30 derniers jours'), h('span.muted.small', `${formatNumber(S.sumValues(entries, addDays(today, -29), today))} ${hb.unit} au total`)),
      lineChart({ data: days, color: hb.color, target: hb.target, unit: hb.unit }),
      h('div.card-head.spaced', h('h2', 'Réussite par semaine')),
      bar,
    );
  } else {
    card.append(h('div.card-head', h('h2', hb.type === 'weekly' ? 'Objectif hebdomadaire' : 'Réussite par semaine'), h('span.muted.small', '12 semaines')), bar);
  }
  return card;
}

function weekdayCard(hb, entries, today) {
  const data = S.byWeekday(hb, entries, today);
  const max = Math.max(...data.map((d) => d.total));
  if (!max) return null;
  let bestDay = null;
  let worstDay = null;
  for (const d of WEEK_ORDER) {
    const x = data[d];
    if (!x.total) continue;
    const r = x.done / x.total;
    if (!bestDay || r > bestDay.r) bestDay = { d, r };
    if (!worstDay || r < worstDay.r) worstDay = { d, r };
  }
  return h(
    'section.card',
    h('div.card-head', h('h2', 'Par jour de la semaine')),
    h(
      'div.weekday-bars',
      WEEK_ORDER.map((d) => {
        const x = data[d];
        const r = x.total ? x.done / x.total : null;
        return h(
          'div.wd-row',
          h('span.wd-label', DAY_LABELS[d]),
          h('div.wd-track', h('div.wd-fill', { style: { width: `${(r || 0) * 100}%` } })),
          h('span.wd-value', r == null ? '–' : `${Math.round(r * 100)} %`),
        );
      }),
    ),
    bestDay && worstDay && bestDay.d !== worstDay.d && h('p.hint', `Ton meilleur jour : ${DAY_LABELS[bestDay.d].toLowerCase()}. Le plus difficile : ${DAY_LABELS[worstDay.d].toLowerCase()}.`),
  );
}

function benefitsCard(hb) {
  const card = h('section.card.benefits-card');
  const list = h('ul.benefit-list');
  for (const b of hb.benefits) list.append(benefitItem(hb, b));

  const input = h('input.input', {
    placeholder: 'Ajouter un bienfait que tu ressens…',
    maxLength: 140,
    onkeydown: (e) => e.key === 'Enter' && add(),
  });
  function add() {
    const v = input.value.trim();
    if (!v) return;
    store.addBenefit(hb.id, v);
    toast('Bienfait ajouté');
  }

  const suggestions = suggestBenefits(hb.name).filter((s) => !hb.benefits.some((b) => b.text === s));

  card.append(
    ...[
    h('div.card-head', h('h2', icon('heart', 18), ' Bienfaits'), h('span.muted.small', hb.benefits.length ? `${hb.benefits.length}` : '')),
    hb.benefits.length ? list : h('p.muted', 'Aucun bienfait pour l’instant. Note ce que cette habitude t’apporte : ça aide à tenir sur la durée.'),
    h('div.add-row', input, h('button.btn.secondary', { onclick: add }, icon('plus', 18), 'Ajouter')),
    suggestions.length > 0 &&
      h(
        'div.suggestions',
        h('small.muted', 'Suggestions :'),
        suggestions.map((s) => h('button.suggest-chip.small', { onclick: () => store.addBenefit(hb.id, s) }, '+ ', s)),
      ),
    ].filter(Boolean),
  );
  return card;
}

function benefitItem(hb, b) {
  const li = h('li');
  function view() {
    clear(li).append(
      h('span.benefit-bullet', { style: { background: hb.color } }),
      h('span.benefit-text', b.text),
      h('button.icon-btn.small', { 'aria-label': 'Modifier', onclick: edit }, icon('edit', 16)),
      h('button.icon-btn.small', { 'aria-label': 'Supprimer', onclick: () => {
        store.removeBenefit(hb.id, b.id);
        toast('Bienfait supprimé', { action: 'Annuler', onAction: () => store.addBenefit(hb.id, b.text) });
      } }, icon('trash', 16)),
    );
  }
  function edit() {
    const input = h('input.input.inline', {
      value: b.text,
      maxLength: 140,
      onkeydown: (e) => {
        if (e.key === 'Enter') store.updateBenefit(hb.id, b.id, input.value);
        if (e.key === 'Escape') view();
      },
    });
    clear(li).append(
      h('span.benefit-bullet', { style: { background: hb.color } }),
      input,
      h('button.icon-btn.small', { 'aria-label': 'Valider', onclick: () => store.updateBenefit(hb.id, b.id, input.value) }, icon('check', 16)),
    );
    input.focus();
    input.select();
  }
  view();
  return li;
}

function journalCard(hb, entries) {
  const items = Object.entries(entries)
    .filter(([, e]) => e.note || e.mood)
    .sort(([a], [b]) => (a < b ? 1 : -1));
  const card = h('section.card', h('div.card-head', h('h2', icon('note', 18), ' Journal'), h('span.muted.small', items.length ? `${items.length} note${items.length > 1 ? 's' : ''}` : '')));
  if (!items.length) {
    card.append(h('p.muted', 'Tes notes et ton humeur apparaîtront ici. Ajoute-les avec le bouton 📝 sur l’écran du jour.'));
    return card;
  }
  const list = h('ul.journal');
  const LIMIT = 8;
  const draw = (all) => {
    clear(list);
    for (const [k, e] of all ? items : items.slice(0, LIMIT)) {
      list.append(
        h(
          'li',
          { onclick: () => openEntrySheet(hb, k) },
          h('span.journal-mood', e.mood ? moodEmoji(e.mood) : '📝'),
          h('div', h('p.journal-date', relativeDay(k)), e.note && h('p', e.note)),
        ),
      );
    }
  };
  draw(false);
  card.append(list);
  if (items.length > LIMIT) {
    const more = h('button.btn.ghost.small', { onclick: () => (draw(true), more.remove()) }, `Voir tout (${items.length})`);
    card.append(more);
  }
  return card;
}

function moreMenu(hb, nav) {
  const sheet = openSheet({
    title: hb.name,
    content: h(
      'div.menu',
      h('button.menu-item', { onclick: () => (sheet.close(), openEntrySheet(hb, todayKey())) }, icon('note'), 'Saisir / noter aujourd’hui'),
      h(
        'button.menu-item',
        {
          onclick: () => {
            downloadFile(`habitude-${hb.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.ics`, buildICS([hb]), 'text/calendar');
            sheet.close();
            toast('Ouvre le fichier pour ajouter le rappel à ton agenda');
          },
        },
        icon('calendar'),
        'Ajouter le rappel à mon agenda (.ics)',
      ),
      h(
        'button.menu-item',
        {
          onclick: () => {
            store.setArchived(hb.id, !hb.archived);
            sheet.close();
            toast(hb.archived ? 'Habitude restaurée' : 'Habitude archivée');
          },
        },
        icon('archive'),
        hb.archived ? 'Restaurer' : 'Archiver (garder l’historique)',
      ),
      h(
        'button.menu-item.danger-text',
        {
          onclick: async () => {
            sheet.close();
            const ok = await confirmDialog({
              title: 'Supprimer définitivement ?',
              message: `« ${hb.name} » et tout son historique seront effacés. Tu peux plutôt l’archiver pour garder tes statistiques.`,
              confirmLabel: 'Supprimer',
              danger: true,
            });
            if (ok) {
              store.deleteHabit(hb.id);
              nav.go('#/habits');
              toast('Habitude supprimée');
            }
          },
        },
        icon('trash'),
        'Supprimer',
      ),
    ),
  });
}
