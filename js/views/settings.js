// Écran « Réglages » : apparence, rappels, sauvegarde.
import { h, icon, toast, confirmDialog, downloadFile, formatNumber } from '../ui.js';
import * as store from '../store.js';
import { ensureNotificationPermission, notificationsSupported, buildICS, checkReminders } from '../reminders.js';
import { loadDemo } from '../demo.js';
import { todayKey, formatFull } from '../dates.js';

export function renderSettings(root, params, nav) {
  const s = store.getSettings();
  const state = store.getState();

  root.append(h('header.page-header', h('div', h('p.eyebrow', 'Préférences'), h('h1', 'Réglages'))));

  const segmented = (options, value, onChange) =>
    h(
      'div.segmented',
      options.map(([v, label]) => h('button', { class: v === value ? 'selected' : '', onclick: () => onChange(v) }, label)),
    );

  // --- Apparence
  root.append(
    h(
      'section.card.settings',
      h('h2', 'Apparence'),
      h('div.setting', h('span', 'Thème'), segmented([['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']], s.theme, (theme) => store.updateSettings({ theme }))),
      h('div.setting', h('span', 'La semaine commence le'), segmented([[1, 'Lundi'], [0, 'Dimanche']], s.weekStart, (weekStart) => store.updateSettings({ weekStart }))),
      h(
        'label.setting',
        h('span', 'Afficher un bienfait du jour'),
        h('span.switch', h('input', { type: 'checkbox', checked: s.showBenefitOnToday, onchange: (e) => store.updateSettings({ showBenefitOnToday: e.target.checked }) }), h('span.slider')),
      ),
    ),
  );

  // --- Rappels
  const perm = notificationsSupported() ? Notification.permission : 'unsupported';
  const withReminder = store.activeHabits().filter((hb) => hb.reminder.enabled);
  root.append(
    h(
      'section.card.settings',
      h('h2', icon('bell', 18), ' Rappels'),
      h(
        'label.setting',
        h('span', 'Notifications'),
        h(
          'span.switch',
          h('input', {
            type: 'checkbox',
            checked: s.notifications && perm === 'granted',
            disabled: perm === 'unsupported',
            onchange: async (e) => {
              if (e.target.checked) {
                const ok = await ensureNotificationPermission();
                if (!ok) {
                  toast('Notifications refusées par le navigateur');
                  return nav.refresh();
                }
              }
              store.updateSettings({ notifications: e.target.checked });
              checkReminders();
            },
          }),
          h('span.slider'),
        ),
      ),
      h(
        'p.hint',
        perm === 'unsupported'
          ? 'Ton navigateur ne gère pas les notifications. Utilise l’export agenda ci-dessous.'
          : perm === 'denied'
            ? 'Les notifications sont bloquées dans les réglages du navigateur.'
            : 'Les notifications arrivent quand l’app est ouverte ou en arrière-plan. Pour des rappels garantis même app fermée, ajoute-les à ton agenda.',
      ),
      h(
        'p.hint',
        withReminder.length
          ? `Rappels programmés : ${withReminder.map((hb) => `${hb.icon} ${hb.reminder.time}`).join(' · ')}`
          : 'Aucun rappel programmé. Active-les dans chaque habitude (bouton Modifier).',
      ),
      h(
        'button.btn.secondary',
        {
          disabled: !store.activeHabits().length,
          onclick: () => {
            const list = withReminder.length ? withReminder : store.activeHabits();
            downloadFile('habitudes-rappels.ics', buildICS(list), 'text/calendar');
            toast('Ouvre le fichier pour l’ajouter à ton agenda');
          },
        },
        icon('calendar', 18),
        'Exporter les rappels vers mon agenda',
      ),
    ),
  );

  // --- Données
  const nbEntries = Object.values(state.entries).reduce((n, m) => n + Object.keys(m).length, 0);
  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    hidden: true,
    onchange: async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const ok = await confirmDialog({
          title: 'Importer cette sauvegarde ?',
          message: 'Tes données actuelles seront remplacées par celles du fichier.',
          confirmLabel: 'Importer',
        });
        if (ok) {
          store.importData(text);
          toast('Sauvegarde importée ✓');
        }
      } catch (err) {
        toast(err.message || 'Fichier invalide');
      }
      e.target.value = '';
    },
  });

  root.append(
    h(
      'section.card.settings',
      h('h2', 'Mes données'),
      h('p.hint', `${state.habits.length} habitude${state.habits.length > 1 ? 's' : ''} · ${formatNumber(nbEntries)} saisie${nbEntries > 1 ? 's' : ''}. Tout est stocké uniquement sur cet appareil.`),
      h('p.hint', state.meta.lastBackup ? `Dernière sauvegarde : ${formatFull(state.meta.lastBackup.slice(0, 10))}` : 'Aucune sauvegarde pour l’instant : pense à en faire une de temps en temps.'),
      h(
        'div.button-stack',
        h(
          'button.btn.primary',
          {
            onclick: () => {
              downloadFile(`habitudes-sauvegarde-${todayKey()}.json`, store.exportData());
              toast('Sauvegarde téléchargée');
              nav.refresh();
            },
          },
          icon('download', 18),
          'Exporter une sauvegarde',
        ),
        h('button.btn.secondary', { onclick: () => fileInput.click() }, icon('upload', 18), 'Importer une sauvegarde'),
        fileInput,
        h(
          'button.btn.ghost',
          {
            onclick: async () => {
              const ok = await confirmDialog({
                title: 'Charger les exemples ?',
                message: 'Des habitudes de démonstration avec un historique remplaceront tes données actuelles.',
                confirmLabel: 'Charger',
              });
              if (ok) {
                loadDemo();
                toast('Exemples chargés');
              }
            },
          },
          'Charger des données d’exemple',
        ),
        h(
          'button.btn.ghost.danger-text',
          {
            onclick: async () => {
              const ok = await confirmDialog({
                title: 'Tout effacer ?',
                message: 'Toutes tes habitudes et ton historique seront supprimés de cet appareil. Exporte une sauvegarde avant si besoin.',
                confirmLabel: 'Tout effacer',
                danger: true,
              });
              if (ok) {
                store.resetAll();
                toast('Données effacées');
                nav.go('#/');
              }
            },
          },
          icon('trash', 18),
          'Tout effacer',
        ),
      ),
    ),
  );

  root.append(
    h(
      'section.card.settings.about',
      h('h2', 'Installer l’application'),
      h('p.hint', 'Sur iPhone : bouton Partager → « Sur l’écran d’accueil ». Sur Android / ordinateur : menu du navigateur → « Installer l’application ». Elle fonctionne ensuite hors ligne.'),
      installButton(),
    ),
  );
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

function installButton() {
  if (!deferredPrompt) return null;
  return h(
    'button.btn.secondary',
    {
      onclick: async () => {
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
      },
    },
    'Installer maintenant',
  );
}
