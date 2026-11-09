// app/javascript/application.js - Modifié pour le système asynchrone

import * as Turbo from "@hotwired/turbo"
window.Turbo = Turbo

import "controllers"

// ✅ Alpine.js - import correct
import * as Alpine from "alpinejs"
window.Alpine = Alpine
Alpine.start()

// ✅ Leaflet - import correct
import * as L from "leaflet"
window.L = L

// ✅ Chart.js - imports corrigés (pas de default export)
import * as ChartModule from "chart.js"
import * as ChartDataLabels from "chartjs-plugin-datalabels"
window.Chart = ChartModule.Chart
window.ChartDataLabels = ChartDataLabels
ChartModule.Chart.register(ChartDataLabels.default)

// ✅ Simple-Statistics - import correct
import * as ss from "simple-statistics"
window.ss = ss

// =========================================
// TABLEAU DE BORD EPCI : recherche d'une commune membre (le reste est le tableau de bord des communes)
// =========================================
import { initializeCommuneSearch } from "epci/commune_search"
window.initializeCommuneSearch = initializeCommuneSearch;

// =========================================
// DASHBOARD COMMUNES (chargement normal)
// =========================================

// Cities Charts - Chargement normal pour les dashboards communes
import "charts/births_chart"
import "charts/families_charts"
import "charts/family_employment_chart"
import "charts/births_projection_chart"

// Dashboard communes - Initialisation normale
import "dashboard/dashboard_init"

// =========================================
// GESTION DES ÉVÉNEMENTS TURBO
// =========================================

// Réinitialiser les systèmes lors des navigations Turbo
document.addEventListener('turbo:before-cache', () => {
  // Nettoyer les ressources avant la mise en cache
  console.log('🧹 Nettoyage avant mise en cache Turbo');

  // Nettoyer les cartes Leaflet pour éviter les fuites mémoire
  if (window.activeMaps) {
    Object.values(window.activeMaps).forEach(map => {
      if (map && map.remove) {
        map.remove();
      }
    });
    window.activeMaps = {};
  }

  // Détruire les graphiques Chart.js actifs
  if (window.Chart && window.Chart.instances) {
    Object.values(window.Chart.instances).forEach(chart => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });
  }
});

document.addEventListener('turbo:load', () => {
  // Réinitialiser les systèmes après navigation Turbo
  console.log('🔄 Rechargement Turbo détecté');

  // Le dashboard manager se réinitialisera automatiquement
  // grâce à l'événement dans dashboard_init.js
});

// =========================================
// UTILITAIRES GLOBAUX
// =========================================

// =========================================
// GESTION D'ERREURS GLOBALE
// =========================================

window.addEventListener('error', (event) => {
  // Log des erreurs JavaScript pour le debugging
  console.error('🚨 Erreur JavaScript:', event.error);

  // En développement, afficher des détails supplémentaires
  if (window.Rails && window.Rails.env === 'development') {
    console.group('🔍 Détails de l\'erreur');
    console.log('Message:', event.message);
    console.log('Fichier:', event.filename);
    console.log('Ligne:', event.lineno);
    console.log('Colonne:', event.colno);
    console.log('Stack:', event.error?.stack);
    console.groupEnd();
  }
});

// Log d'initialisation
console.log('🚀 Application JavaScript initialisée avec le système asynchrone EPCI');
