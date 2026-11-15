# Habitudes 🌱

Application web installable (PWA) pour suivre ses habitudes, voir sa progression et garder en tête **les bienfaits** de chacune.

Elle fonctionne **hors ligne**, sans compte : tes données restent sur ton appareil.

## Fonctionnalités

- **4 types d'habitudes**
  - ✅ **Oui / non** : je l'ai fait ou pas, tous les jours ou certains jours seulement
  - 🔢 **Quantité** : un objectif chiffré par jour (8 verres d'eau, 20 pages, 10 min…) avec des boutons + / −
  - 📅 **X fois par semaine** : ex. sport 3 fois par semaine, les jours que tu veux
  - 🚭 **À arrêter** : compteur de jours sans, bouton « Rechute » (avec annulation)
- **Bienfaits**
  - une bibliothèque d'une trentaine de modèles avec leurs bienfaits suggérés
  - suggestions automatiques selon le nom que tu tapes (« méditation » → bienfaits de la méditation)
  - ajouter, modifier ou supprimer tes propres bienfaits à tout moment
  - un « bienfait du jour » sur l'écran d'accueil pour rester motivé
  - un champ « Pourquoi cette habitude ? » pour noter ta motivation
- **Progression**
  - série actuelle et record, taux de réussite, total, moyenne
  - calendrier façon GitHub sur 6 mois (touche un jour pour corriger un oubli)
  - graphique de réussite par semaine, courbe des quantités avec la ligne d'objectif
  - réussite par jour de la semaine (meilleur jour, jour le plus difficile)
  - statistiques globales : réussite moyenne (comparée à la période précédente), journées parfaites, humeur moyenne, classement des habitudes
- **Notes et humeur** pour chaque journée, puis un journal dans la page de l'habitude
- **Rappels** : notifications à l'heure choisie, et export `.ics` pour des rappels fiables via l'agenda du téléphone
- **Sauvegarde** : export / import en JSON, thème clair / sombre / auto, choix du premier jour de la semaine
- Confettis quand toutes les habitudes du jour sont faites 🎉

## Lancer l'application

Aucune installation ni compilation : ce sont des fichiers statiques.

```bash
npm start        # ou : python3 -m http.server 8080
```

Ouvre ensuite <http://localhost:8080>.

> Le service worker (mode hors ligne, notifications) ne fonctionne qu'en `http://localhost` ou en HTTPS, pas en ouvrant directement `index.html`.

## Mettre en ligne gratuitement (GitHub Pages)

1. Fusionne le code sur la branche `main`.
2. Sur GitHub : **Settings → Pages → Build and deployment → Deploy from a branch**, puis choisis `main` et `/ (root)`.
3. L'app sera disponible sur `https://<ton-compte>.github.io/Habitudes/`.

### L'installer sur son téléphone

- **iPhone (Safari)** : bouton Partager → « Sur l'écran d'accueil »
- **Android (Chrome)** : menu ⋮ → « Installer l'application »

## À propos des rappels

Une PWA sans serveur ne peut pas envoyer de notification quand elle est complètement fermée. Les notifications arrivent quand l'app est ouverte ou en arrière-plan. Pour des rappels garantis, utilise **Réglages → Exporter les rappels vers mon agenda** : le fichier `.ics` crée un événement récurrent avec alarme dans l'agenda de ton téléphone.

## Tests

```bash
npm test
```

Les tests couvrent les calculs : séries, taux de réussite, habitudes hebdomadaires et « à arrêter », suggestions de bienfaits.

## Structure

```
index.html            page unique
manifest.webmanifest  manifeste PWA
sw.js                 service worker (hors ligne, clic sur notification)
css/styles.css        styles (thèmes clair et sombre)
js/app.js             routeur et démarrage
js/store.js           données et sauvegarde locale
js/stats.js           calculs (séries, taux…), sans DOM
js/templates.js       modèles d'habitudes et bienfaits
js/charts.js          graphiques SVG
js/reminders.js       notifications et export agenda
js/views/*.js         écrans (aujourd'hui, détail, liste, stats, réglages, formulaires)
tests/                tests unitaires (node --test)
```
