// Graphiques SVG faits main : calendrier « heatmap », barres hebdomadaires, courbe de valeurs.
import { h } from './ui.js';
import { addDays, dayOfWeek, formatShort, formatLong, formatMonthShort, startOfWeek, DAY_LETTERS } from './dates.js';

// --- Infobulle partagée

let tip;
function tooltip() {
  if (!tip) {
    tip = h('div.chart-tip', { role: 'tooltip' });
    document.body.append(tip);
  }
  return tip;
}

export function showTip(e, html) {
  const t = tooltip();
  t.innerHTML = html;
  t.classList.add('show');
  const r = t.getBoundingClientRect();
  let x = e.clientX - r.width / 2;
  let y = e.clientY - r.height - 14;
  x = Math.max(8, Math.min(x, window.innerWidth - r.width - 8));
  if (y < 8) y = e.clientY + 18;
  t.style.transform = `translate(${x}px, ${y}px)`;
}

export function hideTip() {
  if (tip) tip.classList.remove('show');
}

function bindTip(el, getHtml) {
  el.addEventListener('pointerenter', (e) => showTip(e, getHtml()));
  el.addEventListener('pointermove', (e) => showTip(e, getHtml()));
  el.addEventListener('pointerleave', hideTip);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// --- Calendrier heatmap (style GitHub)

/**
 * cells : fonction (key) => { level: 0..4 | null, label: string, status }
 * level null = jour hors suivi (case neutre).
 */
export function heatmap({ weeks = 26, today, weekStart = 1, color, cell, onSelect }) {
  const size = 13;
  const gap = 3;
  const left = 18;
  const top = 16;
  const first = addDays(startOfWeek(today, weekStart), -7 * (weeks - 1));
  const width = left + weeks * (size + gap);
  const height = top + 7 * (size + gap);

  const svg = h('svg.heatmap', {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    role: 'img',
    'aria-label': 'Calendrier des réalisations',
    style: { '--c': color },
  });

  // Libellés des jours (lun, mer, ven)
  for (let r = 0; r < 7; r++) {
    if (r % 2 === 1) continue;
    const dow = (weekStart + r) % 7;
    svg.append(h('text.axis-label', { x: 0, y: top + r * (size + gap) + size - 2 }, DAY_LETTERS[dow]));
  }

  const firstOfMonthIn = (wk) => [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(wk, i)).find((k) => k.endsWith('-01'));
  for (let w = 0; w < weeks; w++) {
    const wk = addDays(first, w * 7);
    // Libellé du mois sur la colonne qui contient le 1er du mois (et la première colonne
    // si le mois suivant ne commence pas juste après, pour éviter les chevauchements).
    const fom = firstOfMonthIn(wk);
    const showFirst = w === 0 && !fom && !firstOfMonthIn(addDays(wk, 7)) && !firstOfMonthIn(addDays(wk, 14));
    if ((fom && w < weeks - 1) || showFirst) {
      svg.append(h('text.axis-label', { x: left + w * (size + gap), y: 10 }, formatMonthShort(fom || wk).replace('.', '')));
    }

    for (let d = 0; d < 7; d++) {
      const key = addDays(wk, d);
      if (key > today) continue;
      const info = cell(key);
      const rect = h('rect', {
        x: left + w * (size + gap),
        y: top + d * (size + gap),
        width: size,
        height: size,
        rx: 3,
        class: `hm-cell lvl-${info.level == null ? 'na' : info.level}${info.status === 'missed' ? ' missed' : ''}${key === today ? ' today' : ''}`,
      });
      bindTip(rect, () => `<strong>${esc(formatLong(key))}</strong><br>${esc(info.label)}`);
      if (onSelect && info.level != null) {
        rect.classList.add('clickable');
        rect.addEventListener('click', () => {
          hideTip();
          onSelect(key);
        });
      }
      svg.append(rect);
    }
  }

  const wrap = h('div.heatmap-scroll', svg);
  // Faire défiler jusqu'à la date la plus récente.
  requestAnimationFrame(() => (wrap.scrollLeft = wrap.scrollWidth));
  return wrap;
}

export function heatmapLegend(color, labels = ['Moins', 'Plus']) {
  return h(
    'div.hm-legend',
    { style: { '--c': color } },
    h('span', labels[0]),
    [0, 1, 2, 3, 4].map((l) => h('i', { class: `lvl-${l}` })),
    h('span', labels[1]),
  );
}

// --- Barres verticales (taux par semaine, 0..1)

export function barChart({ data, color, height = 140, format, labelFor, tipFor }) {
  const w = 320;
  const padL = 30;
  const padB = 20;
  const padT = 8;
  const innerW = w - padL - 4;
  const innerH = height - padB - padT;
  const n = data.length;
  const slot = innerW / n;
  const bw = Math.max(4, Math.min(22, slot - 4));

  const svg = h('svg.chart', { viewBox: `0 0 ${w} ${height}`, role: 'img', 'aria-label': 'Graphique en barres', style: { '--c': color } });

  for (const t of [0, 0.5, 1]) {
    const y = padT + innerH * (1 - t);
    svg.append(h('line.grid', { x1: padL, x2: w, y1: y, y2: y }));
    svg.append(h('text.axis-label', { x: padL - 6, y: y + 3, 'text-anchor': 'end' }, format(t)));
  }

  data.forEach((d, i) => {
    const x = padL + i * slot + (slot - bw) / 2;
    const v = d.value;
    if (v != null && v > 0) {
      const bh = Math.max(2, innerH * Math.min(v, 1));
      const y = padT + innerH - bh;
      const r = Math.min(4, bw / 2, bh);
      // Coins arrondis en haut uniquement, ancrés sur la ligne de base.
      svg.append(
        h('path.bar', {
          d: `M${x},${padT + innerH} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${padT + innerH} Z`,
        }),
      );
    } else if (v === 0) {
      svg.append(h('line.zero', { x1: x, x2: x + bw, y1: padT + innerH, y2: padT + innerH }));
    }
    // Zone de survol plus large que la barre.
    const hit = h('rect.hit', { x: padL + i * slot, y: padT, width: slot, height: innerH });
    bindTip(hit, () => tipFor(d));
    svg.append(hit);
    const lbl = labelFor(d, i);
    if (lbl) svg.append(h('text.axis-label', { x: x + bw / 2, y: height - 5, 'text-anchor': 'middle' }, lbl));
  });
  return svg;
}

// --- Courbe des valeurs quotidiennes avec ligne d'objectif

export function lineChart({ data, color, target, unit = '', height = 150 }) {
  const w = 320;
  const padL = 34;
  const padR = 8;
  const padB = 20;
  const padT = 10;
  const innerW = w - padL - padR;
  const innerH = height - padB - padT;
  const maxV = Math.max(target || 0, ...data.map((d) => d.value), 1) * 1.1;
  const x = (i) => padL + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v) => padT + innerH * (1 - v / maxV);

  const svg = h('svg.chart', { viewBox: `0 0 ${w} ${height}`, role: 'img', 'aria-label': 'Courbe des valeurs', style: { '--c': color } });
  const nice = niceTicks(maxV);
  for (const t of nice) {
    svg.append(h('line.grid', { x1: padL, x2: w - padR, y1: y(t), y2: y(t) }));
    svg.append(h('text.axis-label', { x: padL - 6, y: y(t) + 3, 'text-anchor': 'end' }, compact(t)));
  }
  if (target) {
    svg.append(h('line.target', { x1: padL, x2: w - padR, y1: y(target), y2: y(target) }));
    svg.append(h('text.axis-label.target-label', { x: w - padR, y: y(target) - 4, 'text-anchor': 'end' }, `objectif ${compact(target)}`));
  }

  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(' ');
  svg.append(h('polygon.area', { points: `${x(0)},${y(0)} ${pts} ${x(data.length - 1)},${y(0)}` }));
  svg.append(h('polyline.line', { points: pts }));

  data.forEach((d, i) => {
    if (i % 7 === (data.length - 1) % 7) {
      svg.append(h('text.axis-label', { x: x(i), y: height - 5, 'text-anchor': 'middle' }, formatShort(d.key).replace('.', '')));
    }
  });

  // Couche de survol : réticule + point + infobulle.
  const cross = h('line.crosshair', { y1: padT, y2: padT + innerH, x1: 0, x2: 0 });
  const dot = h('circle.dot', { r: 4.5, cx: 0, cy: 0 });
  const layer = h('g.hover-layer', cross, dot);
  svg.append(layer);
  const hit = h('rect.hit', { x: padL, y: padT, width: innerW, height: innerH });
  const move = (e) => {
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * w;
    const i = Math.max(0, Math.min(data.length - 1, Math.round(((px - padL) / innerW) * (data.length - 1))));
    const d = data[i];
    cross.setAttribute('x1', x(i));
    cross.setAttribute('x2', x(i));
    dot.setAttribute('cx', x(i));
    dot.setAttribute('cy', y(d.value));
    layer.classList.add('show');
    showTip(e, `<strong>${esc(formatLong(d.key))}</strong><br>${esc(compact(d.value))} ${esc(unit)}${target ? ` / ${esc(compact(target))}` : ''}`);
  };
  hit.addEventListener('pointermove', move);
  hit.addEventListener('pointerenter', move);
  hit.addEventListener('pointerleave', () => {
    layer.classList.remove('show');
    hideTip();
  });
  svg.append(hit);
  return svg;
}

function niceTicks(max) {
  const raw = max / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) || raw;
  const out = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  return out;
}

function compact(v) {
  if (v >= 10000) return `${Math.round(v / 1000)}k`;
  if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.', ',')}k`;
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(v);
}

// --- Anneau de progression

export function ring({ value, size = 120, stroke = 10, color = 'var(--accent)', label, sublabel }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  const svg = h(
    'svg.ring',
    { viewBox: `0 0 ${size} ${size}`, width: size, height: size, role: 'img', 'aria-label': `${Math.round(v * 100)} %` },
    h('circle.ring-track', { cx: size / 2, cy: size / 2, r, 'stroke-width': stroke }),
    h('circle.ring-value', {
      cx: size / 2,
      cy: size / 2,
      r,
      'stroke-width': stroke,
      stroke: color,
      'stroke-dasharray': `${c * v} ${c}`,
      transform: `rotate(-90 ${size / 2} ${size / 2})`,
    }),
  );
  return h('div.ring-wrap', { style: { width: `${size}px`, height: `${size}px` } }, svg, h('div.ring-label', h('strong', label), sublabel && h('small', sublabel)));
}

/** Mini-anneau pour une carte d'habitude. */
export function miniRing(value, color, content) {
  const size = 44;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  return h(
    'div.mini-ring',
    h(
      'svg',
      { viewBox: `0 0 ${size} ${size}`, width: size, height: size, 'aria-hidden': 'true' },
      h('circle.ring-track', { cx: size / 2, cy: size / 2, r, 'stroke-width': stroke }),
      h('circle.ring-value', {
        cx: size / 2,
        cy: size / 2,
        r,
        'stroke-width': stroke,
        stroke: color,
        'stroke-dasharray': `${c * v} ${c}`,
        transform: `rotate(-90 ${size / 2} ${size / 2})`,
      }),
    ),
    h('span.mini-ring-content', content),
  );
}

export { dayOfWeek };
