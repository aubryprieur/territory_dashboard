import AsyncSectionLoader from "epci/async_section_loader"
import { initializeTabsScroll } from "epci/tabs_scroll"

// Gestionnaire global pour l'initialisation du dashboard EPCI
class EpciDashboardManager {
  constructor() {
    this.initialized = false;
    this.asyncLoader = null;

    // Attendre que le DOM soit prêt
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    if (this.initialized) {
      console.log('🔄 Dashboard EPCI déjà initialisé');
      return;
    }

    console.log('🚀 Initialisation du dashboard EPCI (mode asynchrone)');

    try {
      // Vérifier que nous sommes sur la page du dashboard EPCI
      if (!this.isEpciDashboardPage()) {
        console.log('📄 Pas sur la page dashboard EPCI, arrêt de l\'initialisation');
        return;
      }

      // Initialiser le système de chargement asynchrone
      this.initializeAsyncLoader();

      // Initialiser les composants de base (toujours chargés)
      this.initializeBasicComponents();

      // Initialiser les composants JavaScript globaux
      this.initializeGlobalComponents();

      // Marquer comme initialisé
      this.initialized = true;

      console.log('✅ Dashboard EPCI initialisé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du dashboard EPCI:', error);
    }
  }

  isEpciDashboardPage() {
    return document.querySelector('[data-epci-code]') !== null;
  }

  initializeAsyncLoader() {
    // Créer une instance du gestionnaire de sections asynchrones
    this.asyncLoader = new AsyncSectionLoader();

    // Rendre disponible globalement
    window.asyncSectionLoader = this.asyncLoader;
    window.epciDashboardManager = this;

    console.log('🔄 Gestionnaire de sections asynchrones initialisé');
  }

  initializeBasicComponents() {
    // Initialiser la recherche de commune (si présente dans l'aperçu)
    this.initializeCommuneSearch();

    // Initialiser le scroll des onglets
    this.initializeTabsScroll();

    // Initialiser les indicateurs de chargement
    this.initializeLoadingIndicators();

    console.log('🔧 Composants de base initialisés');
  }

  initializeCommuneSearch() {
    console.log('🔍 Initialisation de la recherche de communes');

    let attemptCount = 0;
    const maxAttempts = 50; // Maximum 5 secondes (50 * 100ms)

    const tryInit = () => {
      const communesDataElement = document.getElementById('communes-data-json');
      if (!communesDataElement) {
        console.warn('⚠️ Élément communes-data-json non trouvé');
        return;
      }

      try {
        const data = JSON.parse(communesDataElement.textContent || '{}');
        if (data.communes && Array.isArray(data.communes)) {
          if (window.initializeCommuneSearch) {
            window.initializeCommuneSearch(data.communes);
            console.log('✅ Recherche de communes initialisée avec', data.communes.length, 'communes');
          } else {
            attemptCount++;
            if (attemptCount < maxAttempts) {
              console.log(`⏳ Fonction initializeCommuneSearch pas encore disponible, tentative ${attemptCount}/${maxAttempts}...`);
              setTimeout(tryInit, 100);
            } else {
              console.error('❌ Impossible de charger initializeCommuneSearch après 5 secondes');
            }
          }
        } else {
          console.warn('⚠️ Pas de données de communes trouvées');
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la recherche:', error);
      }
    };

    tryInit();
  }

  initializeTabsScroll() {
    console.log('📜 Initialisation du scroll des onglets');
    initializeTabsScroll(); // Appel de la fonction importée
  }

  initializeLoadingIndicators() {
    // Ajouter des listeners pour afficher les indicateurs de chargement
    document.addEventListener('section:loading-start', (e) => {
      this.showTabLoadingIndicator(e.detail.sectionId);
    });

    document.addEventListener('section:loading-end', (e) => {
      this.hideTabLoadingIndicator(e.detail.sectionId);
    });
  }

  showTabLoadingIndicator(sectionId) {
    const tab = document.querySelector(`[data-tab-id="${sectionId}"]`);
    if (tab) {
      const indicator = tab.querySelector('.async-loading-indicator');
      if (indicator) {
        indicator.classList.remove('hidden');
      }
    }
  }

  hideTabLoadingIndicator(sectionId) {
    const tab = document.querySelector(`[data-tab-id="${sectionId}"]`);
    if (tab) {
      const indicator = tab.querySelector('.async-loading-indicator');
      if (indicator) {
        indicator.classList.add('hidden');
      }
    }
  }

  initializeGlobalComponents() {
    // Initialiser les fonctions globales qui peuvent être appelées par les sections
    this.setupGlobalMapFunctions();
    this.setupGlobalChartFunctions();

    console.log('🌐 Composants globaux initialisés');
  }

  // 🚀 AJOUT : Nouvelle méthode pour initialiser les graphiques Population
  initializePopulationCharts() {
    // Attendre un peu que le DOM soit prêt
    setTimeout(() => {
      console.log('📊 Initialisation des graphiques Population');

      // Initialiser la pyramide des âges
      if (window.initializeAgePyramidChart && typeof window.initializeAgePyramidChart === 'function') {
        window.initializeAgePyramidChart();
      }

      // Initialiser l'historique de population
      if (window.initializePopulationHistoryChart && typeof window.initializePopulationHistoryChart === 'function') {
        window.initializePopulationHistoryChart();
      }
    }, 100);
  }

  setupGlobalMapFunctions() {
    // Fonctions globales pour l'initialisation des cartes
    // Ces fonctions seront appelées par le système asynchrone

    window.initializeFamiliesMaps = () => {
      console.log('🗺️ Initialisation des cartes Familles');
      if (window.EpciFamiliesMaps && typeof window.EpciFamiliesMaps.init === 'function') {
        window.EpciFamiliesMaps.init();
      }
    };

    window.initializeBirthsMap = () => {
      console.log('🗺️ Initialisation de la carte Naissances');
      if (window.EpciBirthsMap && typeof window.EpciBirthsMap.init === 'function') {
        window.EpciBirthsMap.init();
      }
    };

    // 🔧 CORRIGÉ : Une seule définition avec debug intégré
    window.initializeChildrenMaps = () => {
      console.log('🗺️ initializeChildrenMaps appelée');
      console.log('🔍 Vérification EpciChildrenMaps:', window.EpciChildrenMaps);
      console.log('🔍 Type:', typeof window.EpciChildrenMaps);

      if (window.EpciChildrenMaps && typeof window.EpciChildrenMaps.init === 'function') {
        console.log('✅ EpciChildrenMaps.init trouvée, appel en cours');
        window.EpciChildrenMaps.init();
      } else {
        console.error('❌ EpciChildrenMaps.init non trouvée');
        console.log('🔍 Objets window disponibles:', Object.keys(window).filter(k => k.includes('Epci')));

        // Fallback : essayer d'appeler directement les fonctions si elles existent
        if (window.initializeMapEffectifs) {
          console.log('🔄 Fallback: appel direct des fonctions de cartes');
          window.initializeMapEffectifs();
          window.initializeMapTaux();
          window.initializeMapEffectifs3to5();
          window.initializeMapTaux3to5();
        } else {
          console.error('❌ Aucune fonction de carte trouvée');
        }
      }
    };

    window.initializeSchoolingMaps = () => {
      console.log('🗺️ Initialisation des cartes Scolarisation');
      if (window.EpciSchoolingMaps && typeof window.EpciSchoolingMaps.init === 'function') {
        window.EpciSchoolingMaps.init();
      }
    };

    window.initializeEconomicMaps = () => {
      console.log('🗺️ Initialisation des cartes Économie');
      if (window.EpciEconomicMaps && typeof window.EpciEconomicMaps.init === 'function') {
        window.EpciEconomicMaps.init();
      }
    };

    window.initializeChildcareMap = () => {
      console.log('🗺️ Initialisation de la carte Petite Enfance');
      if (window.EpciChildcareMap && typeof window.EpciChildcareMap.init === 'function') {
        window.EpciChildcareMap.init();
      }
    };

    window.initializeWomenEmploymentMaps = () => {
      console.log('🗺️ Initialisation des cartes Emploi Femmes');
      if (window.EpciWomenEmploymentMaps && typeof window.EpciWomenEmploymentMaps.init === 'function') {
        window.EpciWomenEmploymentMaps.init();
      }
    };

    window.initializeDomesticViolenceMap = () => {
      console.log('🗺️ Initialisation de la carte Violences');
      if (window.EpciDomesticViolenceMap && typeof window.EpciDomesticViolenceMap.init === 'function') {
        window.EpciDomesticViolenceMap.init();
      }
    };
  }

  setupGlobalChartFunctions() {
    // Fonctions globales pour l'initialisation des graphiques

    window.initializeBirthsHistoryChart = () => {
      console.log('📊 Initialisation du graphique historique Naissances');
      if (window.EpciBirthsHistoryChart && typeof window.EpciBirthsHistoryChart.init === 'function') {
        window.EpciBirthsHistoryChart.init();
      }
    };

    window.initializeAgePyramidChart = () => {
      console.log('📊 Initialisation de la pyramide des âges');
      if (window.EpciAgePyramidChart && typeof window.EpciAgePyramidChart.init === 'function') {
        window.EpciAgePyramidChart.init();
      }
    };

    window.initializePopulationHistoryChart = () => {
      console.log('📊 Initialisation de l\'historique de population');
      if (window.EpciPopulationHistoryChart && typeof window.EpciPopulationHistoryChart.init === 'function') {
        window.EpciPopulationHistoryChart.init();
      }
    };

    window.initializeFamilyEmploymentChart = () => {
      console.log('📊 Initialisation du graphique Emploi Familles');
      if (window.EpciFamilyEmploymentChart && typeof window.EpciFamilyEmploymentChart.init === 'function') {
        window.EpciFamilyEmploymentChart.init();
      }
    };

    window.initializeDomesticViolenceChart = () => {
      console.log('📊 Initialisation du graphique Violences');

      // Essayer d'abord avec l'objet EpciDomesticViolenceChart
      if (window.EpciDomesticViolenceChart && typeof window.EpciDomesticViolenceChart.init === 'function') {
        console.log('✅ Appel via EpciDomesticViolenceChart.init');
        window.EpciDomesticViolenceChart.init();
      }
      // Fallback : appeler directement la fonction si elle existe
      else if (typeof window.initializeEpciDomesticViolenceChart === 'function') {
        console.log('✅ Fallback: appel direct de initializeEpciDomesticViolenceChart');
        window.initializeEpciDomesticViolenceChart();
      }
      else {
        console.warn('⚠️ Aucune fonction d\'initialisation trouvée pour les graphiques violences');
      }
    };
  }

  // Méthodes utilitaires pour la gestion du dashboard

  getCurrentSection() {
    const activeTab = document.querySelector('[data-tabs-target="tab"].active') ||
                     document.querySelector('[data-tabs-target="tab"]:not(.text-gray-600)');
    return activeTab ? activeTab.dataset.tabId : 'overview';
  }

  switchToSection(sectionId) {
    const tab = document.querySelector(`[data-tab-id="${sectionId}"]`);
    if (tab) {
      tab.click();
    }
  }

  getLoadingStats() {
    return this.asyncLoader ? this.asyncLoader.getLoadingStats() : null;
  }

  // Méthode pour recharger une section en cas d'erreur
  reloadSection(sectionId) {
    if (this.asyncLoader) {
      return this.asyncLoader.reloadSection(sectionId);
    }
  }

  // Méthode pour précharger des sections spécifiques
  preloadSections(sectionIds) {
    if (this.asyncLoader && Array.isArray(sectionIds)) {
      sectionIds.forEach(sectionId => {
        setTimeout(() => {
          this.asyncLoader.loadSectionIfNeeded(sectionId);
        }, Math.random() * 1000); // Étaler les chargements
      });
    }
  }
}

// Initialiser le gestionnaire du dashboard
window.epciDashboardManager = new EpciDashboardManager();

// Ajouter des événements personnalisés pour l'intégration avec d'autres systèmes
document.addEventListener('turbo:load', () => {
  if (window.epciDashboardManager && !window.epciDashboardManager.initialized) {
    window.epciDashboardManager.init();
  }
});

// Export pour utilisation dans d'autres modules
export default EpciDashboardManager;
