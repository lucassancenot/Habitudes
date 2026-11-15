// Petits outils d'interface : création d'éléments, feuilles modales, toasts, confirmations.

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set(['svg', 'g', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'text', 'defs', 'linearGradient', 'stop', 'title']);

/** h('div.card#id', { onclick, ... }, enfants…) */
export function h(sel, props, ...children) {
  if (props == null || typeof props !== 'object' || props instanceof Node || Array.isArray(props)) {
    if (props != null) children.unshift(props);
    props = {};
  }
  const [tagPart, ...rest] = sel.split(/(?=[.#])/);
  const tag = tagPart || 'div';
  const isSvg = SVG_TAGS.has(tag);
  const el = isSvg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  for (const r of rest) {
    if (r[0] === '.') el.classList.add(r.slice(1));
    else if (r[0] === '#') el.id = r.slice(1);
  }
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') {
      for (const c of String(v).split(/\s+/)) if (c) el.classList.add(c);
    } else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {
        if (sv == null) continue;
        if (sk.startsWith('--')) el.style.setProperty(sk, sv);
        else el.style[sk] = sv;
      }
    } else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'dataset') {
      Object.assign(el.dataset, v);
    } else if (k === 'html') {
      el.innerHTML = v;
    } else if (!isSvg && k in el && k !== 'list' && k !== 'form') {
      el[k] = v;
    } else {
      el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children) {
    if (c == null || c === false || c === true) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

// --- Icônes (SVG inline, style trait)

const ICON_PATHS = {
  today: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 15l2 2 4-4',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  stats: 'M3 3v18h18M7 15l4-4 3 3 5-6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  check: 'M20 6 9 17l-5-5',
  x: 'M18 6 6 18M6 6l12 12',
  back: 'M15 18l-6-6 6-6',
  left: 'M15 18l-6-6 6-6',
  right: 'M9 18l6-6-6-6',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z',
  trash: 'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6',
  note: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
  flame: 'M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  archive: 'M21 8v13H3V8M1 3h22v5H1zM10 12h4',
  up: 'M18 15l-6-6-6 6',
  down: 'M6 9l6 6 6-6',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  sparkle: 'M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8',
  more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
};

export function icon(name, size = 20) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('icon');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', ICON_PATHS[name] || '');
  svg.append(p);
  return svg;
}

// --- Feuille modale (bottom sheet sur mobile, dialogue centré sur grand écran)

let openSheets = [];

export function openSheet({ title, content, onClose, wide = false }) {
  const backdrop = h('div.sheet-backdrop');
  const closeBtn = h('button.icon-btn', { 'aria-label': 'Fermer', onclick: () => close() }, icon('x'));
  const body = h('div.sheet-body');
  const sheet = h(
    'div.sheet',
    { role: 'dialog', 'aria-modal': 'true', 'aria-label': title, class: wide ? 'wide' : '' },
    h('div.sheet-handle'),
    h('header.sheet-header', h('h2', title), closeBtn),
    body,
  );
  backdrop.append(sheet);
  backdrop.addEventListener('mousedown', (e) => {
    if (e.target === backdrop) close();
  });
  const onKey = (e) => {
    if (e.key === 'Escape' && openSheets[openSheets.length - 1] === api) close();
  };
  document.addEventListener('keydown', onKey);

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    openSheets = openSheets.filter((s) => s !== api);
    backdrop.classList.add('closing');
    setTimeout(() => backdrop.remove(), 200);
    if (!openSheets.length) document.body.classList.remove('sheet-open');
    onClose && onClose();
  }
  const api = { close, body, sheet, setContent };
  function setContent(node) {
    clear(body).append(node);
  }
  setContent(typeof content === 'function' ? content(api) : content);
  document.body.append(backdrop);
  document.body.classList.add('sheet-open');
  openSheets.push(api);
  requestAnimationFrame(() => {
    backdrop.classList.add('open');
    const first = sheet.querySelector('[autofocus]');
    if (first) first.focus();
  });
  return api;
}

export function closeAllSheets() {
  for (const s of [...openSheets]) s.close();
}

export function confirmDialog({ title, message, confirmLabel = 'Confirmer', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    const sheet = openSheet({
      title,
      onClose: () => !answered && resolve(false),
      content: h(
        'div.stack',
        h('p.muted', message),
        h(
          'div.row.end',
          h('button.btn.ghost', { onclick: () => sheet.close() }, 'Annuler'),
          h(
            'button.btn',
            {
              class: danger ? 'danger' : 'primary',
              onclick: () => {
                answered = true;
                resolve(true);
                sheet.close();
              },
            },
            confirmLabel,
          ),
        ),
      ),
    });
  });
}

// --- Toasts

let toastHost;
export function toast(message, { action, onAction, duration = 3000 } = {}) {
  if (!toastHost) {
    toastHost = h('div.toast-host', { 'aria-live': 'polite' });
    document.body.append(toastHost);
  }
  const t = h(
    'div.toast',
    h('span', message),
    action &&
      h(
        'button.toast-action',
        {
          onclick: () => {
            onAction && onAction();
            dismiss();
          },
        },
        action,
      ),
  );
  toastHost.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  const timer = setTimeout(dismiss, duration);
  function dismiss() {
    clearTimeout(timer);
    t.classList.remove('show');
    setTimeout(() => t.remove(), 250);
  }
}

// --- Divers

export function plural(n, one, many) {
  return `${formatNumber(n)} ${n > 1 || n === 0 ? many : one}`;
}

export function formatNumber(n) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n);
}

export function percent(rate) {
  return rate == null ? '–' : `${Math.round(rate * 100)} %`;
}

export function vibrate(ms = 10) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      /* ignoré */
    }
  }
}

export function downloadFile(filename, content, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Petit feu d'artifice de confettis quand on termine sa journée. */
export function celebrate(colors = ['#6366f1', '#22c55e', '#f97316', '#ec4899', '#eab308']) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = h('div.confetti-host');
  for (let i = 0; i < 60; i++) {
    const c = h('i.confetti', {
      style: {
        left: `${Math.random() * 100}%`,
        background: colors[i % colors.length],
        animationDelay: `${Math.random() * 0.3}s`,
        animationDuration: `${1.2 + Math.random() * 1.2}s`,
        transform: `rotate(${Math.random() * 360}deg)`,
      },
    });
    host.append(c);
  }
  document.body.append(host);
  setTimeout(() => host.remove(), 3000);
}
