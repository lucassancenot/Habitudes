// État de l'application, persistance locale (localStorage) et mutations.
import { todayKey } from './dates.js';

const STORAGE_KEY = 'habitudes:v1';
export const SCHEMA_VERSION = 1;

export const uid = () =>
  (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

function defaultState() {
  return {
    version: SCHEMA_VERSION,
    habits: [],
    entries: {},
    settings: {
      theme: 'auto', // 'auto' | 'light' | 'dark'
      weekStart: 1, // 1 = lundi, 0 = dimanche
      notifications: false,
      showBenefitOnToday: true,
    },
    meta: { createdAt: new Date().toISOString(), lastBackup: null },
  };
}

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.error('Lecture des données impossible', err);
    return defaultState();
  }
}

function migrate(data) {
  const base = defaultState();
  const s = {
    ...base,
    ...data,
    settings: { ...base.settings, ...(data.settings || {}) },
    meta: { ...base.meta, ...(data.meta || {}) },
  };
  s.habits = (s.habits || []).map(normalizeHabit);
  s.entries = s.entries || {};
  s.version = SCHEMA_VERSION;
  return s;
}

export function normalizeHabit(h) {
  return {
    id: h.id || uid(),
    name: h.name || 'Habitude',
    icon: h.icon || '✅',
    color: h.color || '#6366f1',
    type: ['check', 'quantity', 'weekly', 'quit'].includes(h.type) ? h.type : 'check',
    target: Number(h.target) > 0 ? Number(h.target) : 1,
    unit: h.unit || '',
    step: Number(h.step) > 0 ? Number(h.step) : 1,
    timesPerWeek: Math.min(7, Math.max(1, Number(h.timesPerWeek) || 3)),
    days: Array.isArray(h.days) && h.days.length ? h.days.map(Number) : [0, 1, 2, 3, 4, 5, 6],
    benefits: (h.benefits || []).map((b) => (typeof b === 'string' ? { id: uid(), text: b } : { id: b.id || uid(), text: b.text })),
    reminder: { enabled: !!h.reminder?.enabled, time: h.reminder?.time || '09:00' },
    motivation: h.motivation || '',
    createdAt: h.createdAt || todayKey(),
    archived: !!h.archived,
    order: typeof h.order === 'number' ? h.order : 0,
  };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Sauvegarde impossible', err);
  }
}

function commit() {
  persist();
  for (const fn of listeners) fn(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const getState = () => state;
export const getSettings = () => state.settings;
export const getHabit = (id) => state.habits.find((h) => h.id === id);
export const getEntries = (id) => state.entries[id] || {};

export function activeHabits() {
  return state.habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order);
}
export function archivedHabits() {
  return state.habits.filter((h) => h.archived).sort((a, b) => a.order - b.order);
}

// --- Habitudes

export function addHabit(data) {
  const maxOrder = state.habits.reduce((m, h) => Math.max(m, h.order), -1);
  const habit = normalizeHabit({ ...data, id: uid(), order: maxOrder + 1 });
  state.habits.push(habit);
  state.entries[habit.id] = {};
  commit();
  return habit;
}

export function updateHabit(id, patch) {
  const h = getHabit(id);
  if (!h) return;
  Object.assign(h, normalizeHabit({ ...h, ...patch, id }));
  commit();
}

export function deleteHabit(id) {
  state.habits = state.habits.filter((h) => h.id !== id);
  delete state.entries[id];
  commit();
}

export function setArchived(id, archived) {
  updateHabit(id, { archived });
}

export function moveHabit(id, delta) {
  const list = activeHabits();
  const i = list.findIndex((h) => h.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  list.forEach((h, idx) => (h.order = idx));
  commit();
}

// --- Bienfaits

export function addBenefit(habitId, text) {
  const h = getHabit(habitId);
  if (!h || !text.trim()) return;
  h.benefits.push({ id: uid(), text: text.trim() });
  commit();
}

export function updateBenefit(habitId, benefitId, text) {
  const h = getHabit(habitId);
  const b = h?.benefits.find((x) => x.id === benefitId);
  if (!b) return;
  if (!text.trim()) return removeBenefit(habitId, benefitId);
  b.text = text.trim();
  commit();
}

export function removeBenefit(habitId, benefitId) {
  const h = getHabit(habitId);
  if (!h) return;
  h.benefits = h.benefits.filter((b) => b.id !== benefitId);
  commit();
}

// --- Saisies

/** Fusionne `patch` dans la saisie du jour ; supprime la saisie si elle devient vide. */
export function setEntry(habitId, key, patch) {
  const map = (state.entries[habitId] ||= {});
  const next = { value: 0, ...(map[key] || {}), ...patch };
  if (typeof next.value !== 'number' || Number.isNaN(next.value)) next.value = 0;
  next.value = Math.max(0, Math.round(next.value * 100) / 100);
  if (!next.note) delete next.note;
  if (!next.mood) delete next.mood;
  if (next.value === 0 && !next.note && !next.mood) delete map[key];
  else map[key] = next;
  commit();
}

export function toggleDone(habitId, key) {
  const cur = getEntries(habitId)[key]?.value || 0;
  setEntry(habitId, key, { value: cur >= 1 ? 0 : 1 });
}

export function increment(habitId, key, delta) {
  const cur = getEntries(habitId)[key]?.value || 0;
  setEntry(habitId, key, { value: cur + delta });
}

// --- Réglages

export function updateSettings(patch) {
  Object.assign(state.settings, patch);
  commit();
}

// --- Sauvegarde

export function exportData() {
  state.meta.lastBackup = new Date().toISOString();
  persist();
  return JSON.stringify({ app: 'habitudes', exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export function importData(json, { merge = false } = {}) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  if (!data || !Array.isArray(data.habits) || typeof data.entries !== 'object') {
    throw new Error("Ce fichier n'est pas une sauvegarde Habitudes valide.");
  }
  const incoming = migrate(data);
  if (merge) {
    for (const h of incoming.habits) {
      const existing = getHabit(h.id);
      if (existing) Object.assign(existing, h);
      else state.habits.push(h);
      state.entries[h.id] = { ...(state.entries[h.id] || {}), ...(incoming.entries[h.id] || {}) };
    }
  } else {
    state = incoming;
  }
  commit();
}

export function resetAll() {
  state = defaultState();
  commit();
}

/** Remplace l'état (utilisé pour les données de démonstration). */
export function replaceState(next) {
  state = migrate(next);
  commit();
}
