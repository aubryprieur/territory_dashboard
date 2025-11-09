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
// EPCI DASHBOARD - SYSTÈME ASYNCHRONE
// =========================================
import { initializeCommuneSearch } from "epci/commune_search"
window.initializeCommuneSearch = initializeCommuneSearch;

// Import du gestionnaire principal (qui gère l'async loader)
import "epci/dashboard_init"

// Import des composants qui peuvent être chargés de manière asynchrone
// Ces imports rendent les modules disponibles globalement pour le système async

// EPCI Maps - Chargés de manière asynchrone
import "maps/epci_births_map"
import "maps/epci_children_maps"
import "maps/epci_economic_maps"
import "maps/epci_families_maps"
import "maps/epci_women_employment_maps"
import "maps/epci_schooling_maps"
import "maps/epci_childcare_map"
import "maps/epci_domestic_violence_map"

// EPCI Charts - Chargés de manière asynchrone
import "charts/epci_births_history_chart"
import "charts/epci_births_projection_chart"
import "charts/epci_age_pyramid_chart"
import "charts/epci_domestic_violence_chart"
import "charts/epci_population_history_chart"
import "charts/epci_family_employment_chart"
import "charts/epci_communes_chart"

// =========================================
// DASHBOARD COMMUNES (chargement normal)
// =========================================

// Cities Charts - Chargement normal pour les dashboards communes
import "charts/historique_chart"
import "charts/economic_charts"
import "charts/births_chart"
import "charts/domestic_violence_chart"
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

// Fonction utilitaire pour déboguer le système asynchrone
window.debugAsyncSystem = () => {
  if (window.asyncSectionLoader) {
    console.log('📊 Statistiques du système asynchrone:', window.asyncSectionLoader.getLoadingStats());
  } else {
    console.log('❌ Système asynchrone non initialisé');
  }
};

// Fonction utilitaire pour précharger des sections
window.preloadSections = (sectionIds) => {
  if (window.epciDashboardManager) {
    window.epciDashboardManager.preloadSections(sectionIds);
  }
};

// Fonction utilitaire pour recharger une section
window.reloadSection = (sectionId) => {
  if (window.epciDashboardManager) {
    return window.epciDashboardManager.reloadSection(sectionId);
  }
};

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
