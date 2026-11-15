// Tests des calculs (node --test tests/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/stats.js';
import { addDays, startOfWeek, diffDays, range } from '../js/dates.js';
import { findTemplate, suggestBenefits } from '../js/templates.js';

const TODAY = '2026-11-15'; // dimanche
const base = { id: 'x', createdAt: '2026-11-01', days: [0, 1, 2, 3, 4, 5, 6], target: 1, timesPerWeek: 3 };
const habit = (o) => ({ ...base, ...o });
const done = (...keys) => Object.fromEntries(keys.map((k) => [k, { value: 1 }]));

test('dates : semaines et écarts', () => {
  assert.equal(startOfWeek('2026-11-15', 1), '2026-11-09');
  assert.equal(startOfWeek('2026-11-15', 0), '2026-11-15');
  assert.equal(diffDays('2026-11-01', '2026-11-15'), 14);
  assert.equal(addDays('2026-03-28', 2), '2026-03-30'); // changement d'heure
  assert.equal(range('2026-02-27', '2026-03-02').length, 4);
});

test("série oui/non : aujourd'hui non fait ne casse pas la série", () => {
  const h = habit({ type: 'check' });
  const e = done('2026-11-12', '2026-11-13', '2026-11-14');
  assert.equal(S.currentStreak(h, e, TODAY), 3);
  e[TODAY] = { value: 1 };
  assert.equal(S.currentStreak(h, e, TODAY), 4);
  delete e['2026-11-13'];
  assert.equal(S.currentStreak(h, e, TODAY), 2);
  assert.equal(S.bestStreak(h, e, TODAY), 2);
});

test('série oui/non : les jours non prévus sont ignorés', () => {
  // Lundi, mercredi, vendredi seulement
  const h = habit({ type: 'check', days: [1, 3, 5] });
  const e = done('2026-11-09', '2026-11-11', '2026-11-13');
  assert.equal(S.currentStreak(h, e, TODAY), 3);
  assert.equal(S.dayStatus(h, e, '2026-11-14', TODAY), 'off');
});

test('quantité : progression partielle et réussite', () => {
  const h = habit({ type: 'quantity', target: 8 });
  const e = { [TODAY]: { value: 4 }, '2026-11-14': { value: 8 } };
  assert.equal(S.dayProgress(h, e, TODAY), 0.5);
  assert.equal(S.dayStatus(h, e, TODAY, TODAY), 'partial');
  assert.equal(S.dayStatus(h, e, '2026-11-14', TODAY), 'done');
  assert.equal(S.currentStreak(h, e, TODAY), 1);
});

test('hebdomadaire : série en semaines', () => {
  const h = habit({ type: 'weekly', timesPerWeek: 2, createdAt: '2026-10-20' });
  // semaine du 26/10 : 2 fois ; semaine du 02/11 : 2 fois ; semaine du 09/11 : 1 fois (en cours)
  const e = done('2026-10-27', '2026-10-29', '2026-11-03', '2026-11-05', '2026-11-10');
  assert.equal(S.currentStreak(h, e, TODAY), 2);
  e['2026-11-12'] = { value: 1 };
  assert.equal(S.currentStreak(h, e, TODAY), 3);
  const r = S.completionRate(h, e, '2026-10-26', TODAY, TODAY);
  assert.equal(r.done, 3);
  assert.equal(r.total, 3);
});

test('à arrêter : jours sans et rechutes', () => {
  const h = habit({ type: 'quit', createdAt: '2026-11-01' });
  const e = { '2026-11-10': { value: 1 } };
  assert.equal(S.currentStreak(h, e, TODAY), 5); // 11 → 15
  assert.equal(S.bestStreak(h, e, TODAY), 9); // 1 → 9
  assert.equal(S.dayStatus(h, e, '2026-11-10', TODAY), 'missed');
  assert.equal(S.totalSlips(e), 1);
  assert.equal(S.totalDone(h, e, TODAY), 14);
});

test("taux de réussite : aujourd'hui non fait n'est pas compté", () => {
  const h = habit({ type: 'check', createdAt: '2026-11-13' });
  const e = done('2026-11-13');
  const r = S.completionRate(h, e, '2026-11-01', TODAY, TODAY);
  assert.deepEqual([r.done, r.total], [1, 2]);
});

test('début effectif : une saisie antérieure étend le suivi', () => {
  const h = habit({ type: 'check', createdAt: '2026-11-10' });
  const e = done('2026-11-05');
  assert.equal(S.effectiveStart(h, e), '2026-11-05');
  assert.equal(S.dayStatus(h, e, '2026-11-04', TODAY), 'before');
});

test('score global du jour', () => {
  const a = habit({ id: 'a', type: 'check' });
  const b = habit({ id: 'b', type: 'quantity', target: 2 });
  const w = habit({ id: 'w', type: 'weekly' });
  const entries = { a: done('2026-11-14'), b: { '2026-11-14': { value: 1 } }, w: {} };
  assert.equal(S.globalDayScore([a, b, w], entries, '2026-11-14', TODAY), 0.5);
  // Aujourd'hui, rien de fait : en attente → pas de score
  assert.equal(S.globalDayScore([a, b, w], entries, TODAY, TODAY), null);
});

test('modèles : suggestions de bienfaits', () => {
  assert.equal(findTemplate('méditation du matin').name, 'Méditer');
  assert.equal(findTemplate('Boire 2L d’eau').name, "Boire de l'eau");
  assert.ok(suggestBenefits('Arrêter la cigarette').length > 0);
  assert.deepEqual(suggestBenefits('xy'), []);
});
