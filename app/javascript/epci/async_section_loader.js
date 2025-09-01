// app/javascript/epci/async_section_loader.js - Version anti-double-requête corrigée

class AsyncSectionLoader {
  constructor() {
    // Prévenir la double création
    if (window.asyncSectionLoader) {
      console.log('AsyncSectionLoader déjà créé, retour de l\'instance existante');
      return window.asyncSectionLoader;
    }

    this.loadedSections = new Set();
    this.requestInProgress = new Set(); // CRITIQUE: Tracker les requêtes HTTP en cours
    this.requestQueue = new Map(); // Stocker les promesses pour éviter les doublons

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
    console.log('🚀 AsyncSectionLoader créé avec protection anti-double-requête renforcée');
  }

  initializeEventListeners() {
    // CORRECTION MAJEURE: Une seule délégation d'événement avec debouncing
    let clickTimeout = null;

    document.addEventListener('click', (e) => {
      const tabButton = e.target.closest('[data-tab-id]');
      if (tabButton) {
        e.preventDefault(); // Empêcher navigation par défaut

        const sectionId = tabButton.dataset.tabId;

        // Clear previous timeout
        if (clickTimeout) {
          clearTimeout(clickTimeout);
        }

        // Debounce: attendre 150ms avant d'exécuter
        clickTimeout = setTimeout(() => {
          console.log(`🔄 Clic traité pour: ${sectionId}`);
          this.loadSectionIfNeeded(sectionId);
        }, 150);
      }
    }, { passive: false });

    // Intercepter les événements custom du système de tabs
    document.addEventListener('section:activated', (e) => {
      if (e.detail && e.detail.sectionId) {
        this.loadSectionIfNeeded(e.detail.sectionId);
      }
    });
  }

  async loadSectionIfNeeded(sectionId) {
    console.log(`🔍 Demande de chargement: ${sectionId}`);

    // VÉRIFICATION 1: Déjà chargé
    if (this.loadedSections.has(sectionId)) {
      console.log(`📝 Section ${sectionId} déjà chargée`);
      return;
    }

    // VÉRIFICATION 2: Requête en cours
    if (this.requestInProgress.has(sectionId)) {
      console.log(`⏳ Section ${sectionId} en cours, attente de la requête existante...`);

      // Attendre la requête existante au lieu d'en créer une nouvelle
      const existingRequest = this.requestQueue.get(sectionId);
      if (existingRequest) {
        try {
          await existingRequest;
          console.log(`✅ Requête existante terminée pour ${sectionId}`);
        } catch (error) {
          console.error(`❌ Requête existante échouée pour ${sectionId}:`, error);
        }
      }
      return;
    }

    const endpoint = this.sectionEndpoints[sectionId];
    if (!endpoint) {
      console.log(`⚠️ Pas d'endpoint pour: ${sectionId}`);
      return;
    }

    // ÉTAPE CRITIQUE: Marquer comme en cours AVANT de créer la requête
    this.requestInProgress.add(sectionId);

    // Créer et stocker la promesse
    const requestPromise = this.performSectionLoad(sectionId, endpoint);
    this.requestQueue.set(sectionId, requestPromise);

    try {
      await requestPromise;
    } catch (error) {
      console.error(`❌ Erreur lors du chargement de ${sectionId}:`, error);
    } finally {
      // NETTOYAGE OBLIGATOIRE
      this.requestInProgress.delete(sectionId);
      this.requestQueue.delete(sectionId);
    }
  }

  async performSectionLoad(sectionId, endpoint) {
    console.log(`🔄 Chargement HTTP: ${sectionId}`);

    try {
      this.showLoader(sectionId);

      // CORRECTION: Timeout strict et AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ Timeout pour ${sectionId} après 20s`);
        controller.abort();
      }, 20000); // 20s max

      const response = await fetch(endpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
        },
        credentials: 'same-origin'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Injecter le contenu
      await this.injectSectionContent(sectionId, html);

      // IMPORTANT: Marquer comme chargé seulement APRÈS succès complet
      this.loadedSections.add(sectionId);

      // Initialiser les composants
      await this.initializeSectionComponents(sectionId);

      console.log(`✅ Section ${sectionId} chargée avec succès`);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⏰ Requête ${sectionId} annulée (timeout)`);
      } else {
        console.error(`❌ Erreur HTTP pour ${sectionId}:`, error);
        this.showError(sectionId, error);
      }
      throw error; // Re-throw pour être capturé par loadSectionIfNeeded

    } finally {
      this.hideLoader(sectionId);
    }
  }

  showLoader(sectionId) {
    const panel = document.querySelector(`[data-tab-id="${sectionId}"][data-tabs-target="panel"]`);
    if (panel) {
      const loader = this.createLoader(sectionId);
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

  createLoader(sectionId) {
    const loader = document.createElement('div');
    loader.className = 'async-loader flex items-center justify-center h-64';

    const sectionNames = {
      'population': 'population',
      'families': 'familles',
      'children': 'enfants',
      'births': 'naissances',
      'economy': 'données économiques',
      'schooling': 'scolarisation',
      'childcare': 'petite enfance',
      'family-employment': 'emploi des familles',
      'women-employment': 'emploi des femmes',
      'violence': 'violences domestiques'
    };

    const sectionName = sectionNames[sectionId] || 'données';

    loader.innerHTML = `
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Chargement ${sectionName}...</p>
        <div class="w-32 bg-gray-200 rounded-full h-1 mt-2 mx-auto overflow-hidden">
          <div class="bg-blue-600 h-1 rounded-full animate-pulse"></div>
        </div>
      </div>
    `;
    return loader;
  }

  async injectSectionContent(sectionId, html) {
    const panel = document.querySelector(`[data-tab-id="${sectionId}"][data-tabs-target="panel"]`);
    if (panel) {
      panel.innerHTML = html;

      // Déclencher événement pour les composants
      const event = new CustomEvent('dashboard:sectionLoaded', {
        detail: { section: sectionId, timestamp: Date.now() }
      });
      document.dispatchEvent(event);
    }
  }

  showError(sectionId, error) {
    const panel = document.querySelector(`[data-tab-id="${sectionId}"][data-tabs-target="panel"]`);
    if (panel) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'bg-red-50 border border-red-200 rounded-lg p-8 text-center';
      errorDiv.innerHTML = `
        <div class="text-red-600 mb-4">
          <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p class="text-gray-600 mb-4">Impossible de charger cette section. Veuillez réessayer.</p>
        <button onclick="window.asyncSectionLoader.reloadSection('${sectionId}')"
                class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Réessayer
        </button>
      `;
      panel.innerHTML = '';
      panel.appendChild(errorDiv);
    }
  }

  async reloadSection(sectionId) {
    console.log(`🔄 Rechargement forcé: ${sectionId}`);

    // Nettoyer tous les états
    this.loadedSections.delete(sectionId);
    this.requestInProgress.delete(sectionId);
    this.requestQueue.delete(sectionId);

    // Recharger
    await this.loadSectionIfNeeded(sectionId);
  }

  async initializeSectionComponents(sectionId) {
    // Attendre un peu que le DOM soit prêt
    await new Promise(resolve => setTimeout(resolve, 100));

    const initMethods = {
      'population': () => this.initializePopulationComponents(),
      'families': () => this.initializeFamiliesComponents(),
      'births': () => this.initializeBirthsComponents(),
      'children': () => this.initializeChildrenComponents(),
      'schooling': () => this.initializeSchoolingComponents(),
      'economy': () => this.initializeEconomicComponents(),
      'childcare': () => this.initializeChildcareComponents(),
      'family-employment': () => this.initializeFamilyEmploymentComponents(),
      'women-employment': () => this.initializeWomenEmploymentComponents(),
      'violence': () => this.initializeViolenceComponents()
    };

    const initMethod = initMethods[sectionId];
    if (initMethod) {
      try {
        await initMethod();
        console.log(`🎯 Composants ${sectionId} initialisés`);
      } catch (error) {
        console.error(`❌ Erreur init composants ${sectionId}:`, error);
      }
    }
  }

  // Méthodes d'initialisation des composants (simplifiées)
  async initializePopulationComponents() {
    console.log('🔢 Init population');

    if (window.initializeAgePyramidChart) {
      setTimeout(() => window.initializeAgePyramidChart(), 200);
    }
    if (window.initializePopulationHistoryChart) {
      setTimeout(() => window.initializePopulationHistoryChart(), 400);
    }
  }

  async initializeBirthsComponents() {
    console.log('👶 Init naissances');

    // Attendre que les scripts soient chargés
    await new Promise(resolve => setTimeout(resolve, 300));

    // Méthode 1 : Essayer l'objet EpciBirthsMap
    if (window.EpciBirthsMap && typeof window.EpciBirthsMap.init === 'function') {
      console.log('🎯 Utilisation de EpciBirthsMap.init');
      window.EpciBirthsMap.init();
    } else if (typeof window.initializeBirthsCountMap === 'function') {
      console.log('🎯 Fallback - initializeBirthsCountMap');
      window.initializeBirthsCountMap();
    }

    // Méthode 2 : Essayer le graphique d'historique
    if (window.EpciBirthsHistoryChart && typeof window.EpciBirthsHistoryChart.init === 'function') {
      console.log('🎯 Utilisation de EpciBirthsHistoryChart.init');
      setTimeout(() => window.EpciBirthsHistoryChart.init(), 200);
    } else if (typeof window.initializeBirthsHistoryChart === 'function') {
      console.log('🎯 Fallback - initializeBirthsHistoryChart');
      setTimeout(() => window.initializeBirthsHistoryChart(), 200);
    }

    console.log('🔍 État final des fonctions naissances:', {
      EpciBirthsMap: typeof window.EpciBirthsMap,
      EpciBirthsHistoryChart: typeof window.EpciBirthsHistoryChart,
      initializeBirthsCountMap: typeof window.initializeBirthsCountMap,
      initializeBirthsHistoryChart: typeof window.initializeBirthsHistoryChart
    });
  }

  async initializeFamiliesComponents() {
    console.log('👨‍👩‍👧‍👦 Init familles');

    // Attendre que les scripts soient chargés
    await new Promise(resolve => setTimeout(resolve, 300));

    // Méthode 1 : Essayer la fonction globale principale
    if (typeof window.initializeFamiliesMaps === 'function') {
      console.log('🎯 Utilisation de initializeFamiliesMaps');
      window.initializeFamiliesMaps();
      return;
    }

    // Méthode 2 : Essayer l'objet EpciFamiliesMaps
    if (window.EpciFamiliesMaps && typeof window.EpciFamiliesMaps.init === 'function') {
      console.log('🎯 Utilisation de EpciFamiliesMaps.init');
      window.EpciFamiliesMaps.init();
      return;
    }

    // Méthode 3 : Fallback - Essayer les fonctions individuelles
    console.log('🎯 Fallback - Fonctions individuelles');
    const functions = [
      { name: 'initializeFamiliesMap', fn: window.initializeFamiliesMap },
      { name: 'initializeSingleParentMap', fn: window.initializeSingleParentMap },
      { name: 'initializeLargeFamiliesMap', fn: window.initializeLargeFamiliesMap }
    ];

    functions.forEach(({ name, fn }) => {
      if (typeof fn === 'function') {
        console.log(`✅ Exécution de ${name}`);
        try {
          fn();
        } catch (error) {
          console.error(`❌ Erreur dans ${name}:`, error);
        }
      } else {
        console.warn(`⚠️ ${name} non trouvée (type: ${typeof fn})`);
      }
    });

    // Debug final
    console.log('🔍 État final des fonctions familles:', {
      initializeFamiliesMaps: typeof window.initializeFamiliesMaps,
      EpciFamiliesMaps: typeof window.EpciFamiliesMaps,
      initializeLargeFamiliesMap: typeof window.initializeLargeFamiliesMap
    });
  }

  async initializeChildrenComponents() {
    console.log('👦 Init enfants');

    if (window.initializeChildrenMaps) {
      setTimeout(() => window.initializeChildrenMaps(), 200);
    }
  }

  async initializeSchoolingComponents() {
    console.log('🎓 Init scolarisation');

    if (window.initializeSchoolingMaps) {
      setTimeout(() => window.initializeSchoolingMaps(), 200);
    }
  }

  async initializeEconomicComponents() {
    console.log('💰 Init économie');

    if (window.initializeEconomicMaps) {
      setTimeout(() => window.initializeEconomicMaps(), 200);
    }
  }

  async initializeChildcareComponents() {
    console.log('🍼 Init petite enfance');

    if (window.initializeChildcareMap) {
      setTimeout(() => window.initializeChildcareMap(), 200);
    }
  }

  async initializeFamilyEmploymentComponents() {
    console.log('👼 Init emploi familles');

    // Attendre que les scripts soient chargés
    await new Promise(resolve => setTimeout(resolve, 300));

    // Méthode 1 : Essayer l'objet EpciFamilyEmploymentChart
    if (window.EpciFamilyEmploymentChart && typeof window.EpciFamilyEmploymentChart.init === 'function') {
      console.log('🎯 Utilisation de EpciFamilyEmploymentChart.init');
      window.EpciFamilyEmploymentChart.init();
      return;
    }

    // Méthode 2 : Fallback - Essayer la fonction directe
    if (typeof window.initializeEpciFamilyEmploymentCharts === 'function') {
      console.log('🎯 Fallback - initializeEpciFamilyEmploymentCharts');
      window.initializeEpciFamilyEmploymentCharts();
      return;
    }

    console.warn('⚠️ Aucune fonction d\'emploi familles trouvée');
    console.log('🔍 État des fonctions emploi familles:', {
      EpciFamilyEmploymentChart: typeof window.EpciFamilyEmploymentChart,
      initializeEpciFamilyEmploymentCharts: typeof window.initializeEpciFamilyEmploymentCharts
    });
  }

  async initializeWomenEmploymentComponents() {
    console.log('👩‍💼 Init emploi femmes');

    if (window.initializeWomenEmploymentMaps) {
      setTimeout(() => window.initializeWomenEmploymentMaps(), 200);
    }
  }

  async initializeViolenceComponents() {
    console.log('🚨 Init violences');

    // Attendre que les scripts soient chargés
    await new Promise(resolve => setTimeout(resolve, 300));

    // Initialiser la carte
    if (window.EpciDomesticViolenceMap && typeof window.EpciDomesticViolenceMap.init === 'function') {
      console.log('🎯 Utilisation de EpciDomesticViolenceMap.init');
      window.EpciDomesticViolenceMap.init();
    } else if (typeof window.initializeDomesticViolenceMap === 'function') {
      console.log('🎯 Fallback - initializeDomesticViolenceMap');
      window.initializeDomesticViolenceMap();
    }

    // Initialiser le graphique
    if (window.EpciDomesticViolenceChart && typeof window.EpciDomesticViolenceChart.init === 'function') {
      console.log('🎯 Utilisation de EpciDomesticViolenceChart.init');
      setTimeout(() => window.EpciDomesticViolenceChart.init(), 200);
    } else if (typeof window.initializeEpciDomesticViolenceChart === 'function') {
      console.log('🎯 Fallback - initializeEpciDomesticViolenceChart');
      setTimeout(() => window.initializeEpciDomesticViolenceChart(), 200);
    }

    console.log('🔍 État final des fonctions violences:', {
      EpciDomesticViolenceMap: typeof window.EpciDomesticViolenceMap,
      EpciDomesticViolenceChart: typeof window.EpciDomesticViolenceChart,
      initializeDomesticViolenceMap: typeof window.initializeDomesticViolenceMap,
      initializeEpciDomesticViolenceChart: typeof window.initializeEpciDomesticViolenceChart
    });
  }

  // API publique pour debugging
  getLoadingStats() {
    return {
      loadedSections: Array.from(this.loadedSections),
      sectionsInProgress: Array.from(this.requestInProgress),
      queuedRequests: Array.from(this.requestQueue.keys()),
      totalSections: Object.keys(this.sectionEndpoints).length
    };
  }

  // Méthode pour précharger intelligemment
  async preloadPopularSections() {
    const popularSections = ['families', 'children']; // Sections les plus consultées

    setTimeout(async () => {
      for (const sectionId of popularSections) {
        if (!this.loadedSections.has(sectionId) && !this.requestInProgress.has(sectionId)) {
          console.log(`🔄 Préchargement: ${sectionId}`);
          await this.loadSectionIfNeeded(sectionId);
          // Pause entre préchargements
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }, 3000); // Attendre 3s après le chargement initial
  }
}

// INITIALISATION SÉCURISÉE - UNE SEULE INSTANCE
if (!window.asyncSectionLoader) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.asyncSectionLoader = new AsyncSectionLoader();
      // Optionnel: précharger après initialisation
      window.asyncSectionLoader.preloadPopularSections();
    });
  } else {
    window.asyncSectionLoader = new AsyncSectionLoader();
    window.asyncSectionLoader.preloadPopularSections();
  }
}

export default AsyncSectionLoader;
