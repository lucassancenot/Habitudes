// Rappels : notifications locales (quand l'app est ouverte ou en arrière-plan)
// et export .ics pour des rappels fiables via l'agenda du téléphone.
import * as store from './store.js';
import { todayKey, toKey } from './dates.js';
import { isDone, isScheduled, weekCount, weekTarget } from './stats.js';
import { startOfWeek } from './dates.js';

const SENT_KEY = 'habitudes:reminders-sent';

export function notificationsSupported() {
  return 'Notification' in window;
}

export async function ensureNotificationPermission() {
  if (!notificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

function readSent() {
  try {
    return JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeSent(v) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(v));
  } catch {
    /* ignoré */
  }
}

async function notify(title, options) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return reg.showNotification(title, options);
  } catch {
    /* repli ci-dessous */
  }
  try {
    new Notification(title, options);
  } catch {
    /* certains navigateurs mobiles exigent le service worker */
  }
}

/** Faut-il encore rappeler cette habitude aujourd'hui ? */
function needsReminder(habit, today) {
  const entries = store.getEntries(habit.id);
  if (habit.type === 'quit') return true; // rappel d'encouragement
  if (habit.type === 'weekly') {
    const ws = store.getSettings().weekStart;
    return !isDone(habit, entries, today) && weekCount(habit, entries, startOfWeek(today, ws)) < weekTarget(habit);
  }
  return isScheduled(habit, today) && !isDone(habit, entries, today);
}

export function checkReminders(now = new Date()) {
  if (!store.getSettings().notifications) return;
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const today = toKey(now);
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const sent = readSent();
  // Nettoyer les jours passés
  for (const k of Object.keys(sent)) if (!k.startsWith(today)) delete sent[k];

  for (const habit of store.activeHabits()) {
    if (!habit.reminder.enabled) continue;
    if (hhmm < habit.reminder.time) continue;
    const id = `${today}:${habit.id}`;
    if (sent[id]) continue;
    sent[id] = true;
    if (!needsReminder(habit, today)) continue;
    const body =
      habit.type === 'quit'
        ? 'Tiens bon, chaque jour compte 💪'
        : habit.benefits.length
          ? `Pense à : ${habit.benefits[Math.floor(Math.random() * habit.benefits.length)].text}`
          : "C'est le moment !";
    notify(`${habit.icon} ${habit.name}`, {
      body,
      tag: id,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      data: { url: `#/habit/${habit.id}` },
    });
  }
  writeSent(sent);
}

let timer;
export function startReminderLoop() {
  clearInterval(timer);
  checkReminders();
  timer = setInterval(checkReminders, 30 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkReminders();
  });
}

// --- Export agenda (.ics)

const ICS_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);
}

export function buildICS(habits) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Habitudes//FR', 'CALSCALE:GREGORIAN'];
  const start = todayKey().replace(/-/g, '');
  for (const h of habits) {
    const time = (h.reminder.enabled ? h.reminder.time : '09:00').replace(':', '') + '00';
    let rrule = 'FREQ=DAILY';
    if ((h.type === 'check' || h.type === 'quantity') && h.days.length < 7) {
      rrule = `FREQ=WEEKLY;BYDAY=${h.days.map((d) => ICS_DAYS[d]).join(',')}`;
    }
    const desc = [h.motivation, ...h.benefits.map((b) => `• ${b.text}`)].filter(Boolean).join('\n');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${h.id}@habitudes`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}T${time}`,
      'DURATION:PT10M',
      `RRULE:${rrule}`,
      `SUMMARY:${icsEscape(`${h.icon} ${h.name}`)}`,
      `DESCRIPTION:${icsEscape(desc)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsEscape(h.name)}`,
      'TRIGGER:PT0M',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
