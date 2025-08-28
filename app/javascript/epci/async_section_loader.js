// app/javascript/epci/async_section_loader.js

class AsyncSectionLoader {
  constructor() {
    this.loadedSections = new Set();
    this.loadingQueue = new Map();
    this.sectionEndpoints = {
      'population': '/epci_dashboard/load_population',
      'families': '/epci_dashboard/load_families',
      'births': '/epci_dashboard/load_births',
      'children': '/epci_dashboard/load_children',
      'schooling': '/epci_dashboard/load_schooling',
      'economy': '/epci_dashboard/load_economic',
      'childcare': '/epci_dashboard/load_childcare',
      'family-employment': '/epci_dashboard/load_family_employment',
      'women-employment': '/epci_dashboard/load_women_employment',
      'violence': '/epci_dashboard/load_domestic_violence'
    };

    this.initializeEventListeners();
    console.log('🚀 AsyncSectionLoader initialisé');
  }

  initializeEventListeners() {
    // Observer les changements d'onglets
    document.addEventListener('click', (e) => {
      const tabButton = e.target.closest('[data-tab-id]');
      if (tabButton) {
        const sectionId = tabButton.dataset.tabId;
        this.loadSectionIfNeeded(sectionId);
      }
    });

    // Intercepter les événements custom du système de tabs
    document.addEventListener('section:activated', (e) => {
      this.loadSectionIfNeeded(e.detail.sectionId);
    });
  }

  async loadSectionIfNeeded(sectionId) {
    // Vérifier si la section est déjà chargée ou en cours de chargement
    if (this.loadedSections.has(sectionId) || this.loadingQueue.has(sectionId)) {
      console.log(`📝 Section ${sectionId} déjà chargée ou en cours de chargement`);
      return;
    }

    // Vérifier si l'endpoint existe pour cette section
    const endpoint = this.sectionEndpoints[sectionId];
    if (!endpoint) {
      console.log(`⚠️ Pas d'endpoint défini pour la section: ${sectionId}`);
      return;
    }

    // Marquer la section comme en cours de chargement
    this.loadingQueue.set(sectionId, true);

    try {
      console.log(`🔄 Chargement de la section: ${sectionId}`);

      // Afficher le loader
      this.showLoader(sectionId);

      // Faire la requête AJAX
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
        },
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const html = await response.text();

      // Injecter le contenu dans le panel correspondant
      await this.injectSectionContent(sectionId, html);

      // Marquer comme chargé
      this.loadedSections.add(sectionId);

      // Initialiser les composants JavaScript spécifiques à la section
      await this.initializeSectionComponents(sectionId);

      console.log(`✅ Section ${sectionId} chargée avec succès`);

    } catch (error) {
      console.error(`❌ Erreur lors du chargement de la section ${sectionId}:`, error);
      this.showError(sectionId, error);
    } finally {
      // Retirer de la queue de chargement
      this.loadingQueue.delete(sectionId);
      this.hideLoader(sectionId);
    }
  }

  showLoader(sectionId) {
    const panel = document.querySelector(`[data-tab-id="${sectionId}"][data-tabs-target="panel"]`);
    if (panel) {
      const loader = this.createLoader();
      panel.innerHTML = '';
      panel.appendChild(loader);
    }
  }

  hideLoader(sectionId) {
    const panel = document.querySelector(`[data-tab-id="${sectionId}"][data-tabs-target="panel"]`);
    if (panel) {
      const loader = panel.querySelector('.async-loader');
      if (loader) {
        loader.remove();
      }
    }
  }

  createLoader() {
    const loader = document.createElement('div');
    loader.className = 'async-loader flex items-center justify-center h-64';
    loader.innerHTML = `
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Chargement des données...</p>
      </div>
    `;
    return loader;
  }

  async injectSectionContent(sectionId, html) {
    const panel = document.querySelector(`[data-tab-id="${sectionId}"][data-tabs-target="panel"]`);
    if (panel) {
      // Créer un wrapper pour le contenu
      const wrapper = document.createElement('div');
      wrapper.className = 'bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6';
      wrapper.innerHTML = html;

      // Remplacer le contenu
      panel.innerHTML = '';
      panel.appendChild(wrapper);

      // Déclencher un événement personnalisé pour signaler que le contenu est injecté
      document.dispatchEvent(new CustomEvent('section:content-loaded', {
        detail: { sectionId, panel }
      }));
    }
  }

  async initializeSectionComponents(sectionId) {
    // Attendre un peu pour que le DOM soit bien injecté
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      switch (sectionId) {
        case 'population':
          await this.initializePopulationComponents();
          break;
        case 'families':
          await this.initializeFamiliesComponents();
          break;
        case 'births':
          await this.initializeBirthsComponents();
          break;
        case 'children':
          await this.initializeChildrenComponents();
          break;
        case 'schooling':
          await this.initializeSchoolingComponents();
          break;
        case 'economy':
          await this.initializeEconomicComponents();
          break;
        case 'childcare':
          await this.initializeChildcareComponents();
          break;
        case 'family-employment':
          await this.initializeFamilyEmploymentComponents();
          break;
        case 'women-employment':
          await this.initializeWomenEmploymentComponents();
          break;
        case 'violence':
          await this.initializeDomesticViolenceComponents();
          break;
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'initialisation des composants pour ${sectionId}:`, error);
    }
  }

  // Méthodes d'initialisation spécifiques par section
  async initializePopulationComponents() {
    console.log('👥 Initialisation des composants Population');

    // Initialiser la pyramide des âges
    if (window.initializeAgePyramidChart && typeof window.initializeAgePyramidChart === 'function') {
      window.initializeAgePyramidChart();
    }

    // Initialiser l'historique de population
    if (window.initializePopulationHistoryChart && typeof window.initializePopulationHistoryChart === 'function') {
      window.initializePopulationHistoryChart();
    }
  }

  async initializeFamiliesComponents() {
    console.log('🏠 Initialisation des composants Familles');

    // Initialiser les cartes Leaflet pour les familles
    if (window.initializeFamiliesMaps && typeof window.initializeFamiliesMaps === 'function') {
      window.initializeFamiliesMaps();
    }

    // Réinitialiser les graphiques si nécessaire
    if (window.Chart && document.querySelector('#families-chart')) {
      // Code d'initialisation des graphiques familles
    }
  }

  async initializeBirthsComponents() {
    console.log('👶 Initialisation des composants Naissances');

    // Initialiser la carte des naissances
    if (window.initializeBirthsMap && typeof window.initializeBirthsMap === 'function') {
      window.initializeBirthsMap();
    }

    // Initialiser le graphique historique des naissances
    if (window.initializeBirthsHistoryChart && typeof window.initializeBirthsHistoryChart === 'function') {
      window.initializeBirthsHistoryChart();
    }
  }

  async initializeChildrenComponents() {
    console.log('👦 Initialisation des composants Enfants');

    // Initialiser les cartes des enfants
    if (window.initializeChildrenMaps && typeof window.initializeChildrenMaps === 'function') {
      window.initializeChildrenMaps();
    }

    // Initialiser la pyramide des âges
    if (window.initializeAgePyramidChart && typeof window.initializeAgePyramidChart === 'function') {
      window.initializeAgePyramidChart();
    }

    // Initialiser l'historique de population
    if (window.initializePopulationHistoryChart && typeof window.initializePopulationHistoryChart === 'function') {
      window.initializePopulationHistoryChart();
    }
  }

  async initializeSchoolingComponents() {
    console.log('🎓 Initialisation des composants Scolarisation');

    // Initialiser les cartes de scolarisation
    if (window.initializeSchoolingMaps && typeof window.initializeSchoolingMaps === 'function') {
      window.initializeSchoolingMaps();
    }
  }

  async initializeEconomicComponents() {
    console.log('💰 Initialisation des composants Économie');

    // Initialiser les cartes économiques
    if (window.initializeEconomicMaps && typeof window.initializeEconomicMaps === 'function') {
      window.initializeEconomicMaps();
    }
  }

  async initializeChildcareComponents() {
    console.log('🍼 Initialisation des composants Petite Enfance');

    // Initialiser la carte de la petite enfance
    if (window.initializeChildcareMap && typeof window.initializeChildcareMap === 'function') {
      window.initializeChildcareMap();
    }
  }

  async initializeFamilyEmploymentComponents() {
    console.log('👨‍👩‍👧‍👦 Initialisation des composants Emploi Familles');

    // Initialiser les graphiques d'emploi des familles
    if (window.initializeFamilyEmploymentChart && typeof window.initializeFamilyEmploymentChart === 'function') {
      window.initializeFamilyEmploymentChart();
    }
  }

  async initializeWomenEmploymentComponents() {
    console.log('👩‍💼 Initialisation des composants Emploi Femmes');

    // Initialiser les cartes d'emploi des femmes
    if (window.initializeWomenEmploymentMaps && typeof window.initializeWomenEmploymentMaps === 'function') {
      window.initializeWomenEmploymentMaps();
    }
  }

  async initializeDomesticViolenceComponents() {
    console.log('⚠️ Initialisation des composants Violences');

    // Initialiser la carte des violences domestiques
    if (window.initializeDomesticViolenceMap && typeof window.initializeDomesticViolenceMap === 'function') {
      console.log('✅ Initialisation de la carte violences');
      window.initializeDomesticViolenceMap();
    }

    // Initialiser le graphique des violences domestiques - Essayer plusieurs méthodes
    if (window.initializeDomesticViolenceChart && typeof window.initializeDomesticViolenceChart === 'function') {
      console.log('✅ Appel via window.initializeDomesticViolenceChart');
      window.initializeDomesticViolenceChart();
    }
    else if (window.EpciDomesticViolenceChart && typeof window.EpciDomesticViolenceChart.init === 'function') {
      console.log('✅ Appel via window.EpciDomesticViolenceChart.init');
      window.EpciDomesticViolenceChart.init();
    }
    else if (window.initializeEpciDomesticViolenceChart && typeof window.initializeEpciDomesticViolenceChart === 'function') {
      console.log('✅ Appel via window.initializeEpciDomesticViolenceChart');
      window.initializeEpciDomesticViolenceChart();
    }
    else {
      console.warn('⚠️ Aucune fonction d\'initialisation trouvée pour le graphique violences');
      console.log('🔍 Fonctions disponibles:', Object.keys(window).filter(k => k.includes('Violence') || k.includes('Domestic')));
    }
  }

  showError(sectionId, error) {
    const panel = document.querySelector(`[data-tab-id="${sectionId}"][data-tabs-target="panel"]`);
    if (panel) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6';
      errorDiv.innerHTML = `
        <div class="text-center py-12">
          <div class="text-red-500 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p class="text-gray-600 mb-4">Impossible de charger les données de cette section.</p>
          <button onclick="window.asyncSectionLoader.reloadSection('${sectionId}')"
                  class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            Réessayer
          </button>
        </div>
      `;
      panel.innerHTML = '';
      panel.appendChild(errorDiv);
    }
  }

  async reloadSection(sectionId) {
    // Retirer de la liste des sections chargées pour forcer le rechargement
    this.loadedSections.delete(sectionId);
    await this.loadSectionIfNeeded(sectionId);
  }

  // Méthode pour précharger les sections populaires
  async preloadPopularSections() {
    const popularSections = ['families', 'children']; // Sections les plus consultées

    // Attendre 2 secondes après le chargement initial avant de précharger
    setTimeout(async () => {
      for (const sectionId of popularSections) {
        if (!this.loadedSections.has(sectionId)) {
          console.log(`🔄 Préchargement de la section: ${sectionId}`);
          await this.loadSectionIfNeeded(sectionId);
          // Attendre un peu entre chaque préchargement
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }, 2000);
  }

  // Méthode pour obtenir les statistiques de chargement
  getLoadingStats() {
    return {
      loadedSections: Array.from(this.loadedSections),
      loadingQueue: Array.from(this.loadingQueue.keys()),
      totalSections: Object.keys(this.sectionEndpoints).length
    };
  }
}

// Initialiser le gestionnaire de sections asynchrones
document.addEventListener('DOMContentLoaded', () => {
  window.asyncSectionLoader = new AsyncSectionLoader();

  // Optionnel : précharger les sections populaires
  window.asyncSectionLoader.preloadPopularSections();
});

// Export pour utilisation dans d'autres modules
export default AsyncSectionLoader;
