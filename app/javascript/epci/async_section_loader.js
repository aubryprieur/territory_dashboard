// app/javascript/epci/async_section_loader.js - Version CORRIGÉE contre double-appels

class AsyncSectionLoader {
  constructor() {
    if (window.asyncSectionLoader) {
      console.log('AsyncSectionLoader déjà créé, retour instance existante');
      return window.asyncSectionLoader;
    }

    this.loadedSections = new Set();
    this.requestInProgress = new Set();
    this.requestQueue = new Map();
    this.initializationInProgress = new Set();

    // NOUVEAU: Protection contre l'initialisation multiple des composants
    this.componentsInitialized = new Set();

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
    console.log('🚀 AsyncSectionLoader ÉTAPE 6 COMPLÈTE - Tous graphiques restaurés');
  }

  initializeEventListeners() {
    // Protection renforcée contre les clics multiples
    let lastClickTime = 0;
    const DEBOUNCE_DELAY = 300; // 300ms entre clics

    document.addEventListener('click', (e) => {
      const tabButton = e.target.closest('[data-tab-id]');
      if (tabButton) {
        const now = Date.now();
        const sectionId = tabButton.dataset.tabId;

        // Protection anti-spam
        if (now - lastClickTime < DEBOUNCE_DELAY) {
          console.log(`🛡️ Clic trop rapide ignoré pour ${sectionId}`);
          return;
        }

        lastClickTime = now;
        console.log(`🎯 Clic immédiat pour: ${sectionId}`);
        this.loadSectionIfNeeded(sectionId);
      }
    }, { passive: true });

    document.addEventListener('section:activate', (e) => {
      if (e.detail && e.detail.sectionId) {
        this.loadSectionIfNeeded(e.detail.sectionId);
      }
    });
  }

  async loadSectionIfNeeded(sectionId) {
    console.log(`🔍 ÉTAPE 6 - Demande de chargement: ${sectionId}`);
    console.log(`- Déjà chargé: ${this.loadedSections.has(sectionId)}`);
    console.log(`- Requête en cours: ${this.requestInProgress.has(sectionId)}`);

    if (this.loadedSections.has(sectionId)) {
      console.log(`✅ Section ${sectionId} déjà chargée`);
      return;
    }

    if (this.requestInProgress.has(sectionId)) {
      console.log(`⏳ PROTECTION: Requête déjà en cours pour ${sectionId}, attente...`);
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
      console.warn(`⚠️ Endpoint non trouvé pour: ${sectionId}`);
      return;
    }

    this.requestInProgress.add(sectionId);
    console.log(`🚀 ÉTAPE 6: Démarrage fetch ${sectionId}`);

    const requestPromise = this.fetchSection(sectionId, endpoint);
    this.requestQueue.set(sectionId, requestPromise);

    return requestPromise;
  }

  async fetchSection(sectionId, endpoint) {
    const startTime = Date.now();
    console.log(`🔥 ÉTAPE 6: Début fetch ${sectionId} - ${endpoint}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ Timeout pour ${sectionId} après 15s`);
        controller.abort();
      }, 15000);

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
      this.injectSectionContent(sectionId, html);
      this.loadedSections.add(sectionId);

      const duration = Date.now() - startTime;
      console.log(`✅ ÉTAPE 6: Section ${sectionId} chargée en ${duration}ms`);

      // ÉTAPE 6: Initialisation complète avec protection renforcée
      await this.initializeSectionComponentsComplete(sectionId);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⏰ Requête ${sectionId} annulée (timeout)`);
      } else {
        console.error(`❌ Erreur HTTP pour ${sectionId}:`, error);
        this.showError(sectionId, error);
      }
      throw error;

    } finally {
      console.log(`🧹 ÉTAPE 6: Nettoyage pour ${sectionId}`);
      this.requestInProgress.delete(sectionId);
      this.requestQueue.delete(sectionId);
    }
  }

  injectSectionContent(sectionId, html) {
    const container = document.querySelector(`[data-section-id="${sectionId}"]`) ||
                     document.querySelector(`[data-tab-id="${sectionId}"][data-tabs-target="panel"]`);

    if (container) {
      container.innerHTML = html;
      container.offsetHeight; // Force reflow

      const event = new CustomEvent('dashboard:sectionLoaded', {
        detail: { section: sectionId, timestamp: Date.now() }
      });
      document.dispatchEvent(event);

      console.log(`📝 ÉTAPE 6: Contenu injecté pour ${sectionId}`);
    } else {
      console.error(`❌ Container non trouvé pour: ${sectionId}`);
    }
  }

  showError(sectionId, error) {
    const container = document.querySelector(`[data-section-id="${sectionId}"]`) ||
                     document.querySelector(`[data-tab-id="${sectionId}"][data-tabs-target="panel"]`);

    if (container) {
      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div class="text-red-600 mb-4">
            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
          <p class="text-gray-600 mb-4">Impossible de charger cette section.</p>
          <button onclick="window.asyncSectionLoader.reloadSection('${sectionId}')"
                  class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Réessayer
          </button>
        </div>
      `;
    }
  }

  async reloadSection(sectionId) {
    console.log(`🔄 ÉTAPE 6: Rechargement forcé ${sectionId}`);
    this.loadedSections.delete(sectionId);
    this.requestInProgress.delete(sectionId);
    this.requestQueue.delete(sectionId);
    this.initializationInProgress.delete(sectionId);
    this.componentsInitialized.delete(sectionId); // NOUVEAU: Reset des composants
    await this.loadSectionIfNeeded(sectionId);
  }

  async initializeSectionComponentsComplete(sectionId) {
    console.log(`🎯 ÉTAPE 6: Init COMPLÈTE ${sectionId}`);

    // PROTECTION RENFORCÉE: Vérifier si déjà en cours ou fait
    if (this.initializationInProgress.has(sectionId)) {
      console.log(`⏸️ Initialisation déjà en cours pour ${sectionId}`);
      return;
    }

    if (this.componentsInitialized.has(sectionId)) {
      console.log(`✅ Composants déjà initialisés pour ${sectionId}`);
      return;
    }

    this.initializationInProgress.add(sectionId);

    try {
      // Délais appropriés selon la complexité de chaque section
      const delays = {
        'families': 400,  // Plus long car plusieurs cartes
        'schooling': 300,
        'births': 350,
        'children': 250,
        'population': 200,
        'violence': 300,
        'economy': 200,
        'childcare': 200,
        'family-employment': 200,
        'women-employment': 200
      };

      await new Promise(resolve => setTimeout(resolve, delays[sectionId] || 200));

      const initMethods = {
        'families': () => this.initializeFamiliesComplete(),
        'schooling': () => this.initializeSchoolingComplete(),
        'births': () => this.initializeBirthsComplete(),
        'children': () => this.initializeChildrenComplete(),
        'population': () => this.initializePopulationComplete(),
        'economy': () => this.initializeEconomicComplete(),
        'childcare': () => this.initializeChildcareComplete(),
        'family-employment': () => this.initializeFamilyEmploymentComplete(),
        'women-employment': () => this.initializeWomenEmploymentComplete(),
        'violence': () => this.initializeViolenceComplete()
      };

      const initMethod = initMethods[sectionId];
      if (initMethod) {
        await initMethod();
        // MARQUER COMME INITIALISÉ SEULEMENT EN CAS DE SUCCÈS
        this.componentsInitialized.add(sectionId);
        console.log(`✅ ÉTAPE 6: Composants ${sectionId} initialisés COMPLÈTEMENT`);
      }

    } catch (error) {
      console.error(`❌ Erreur init complète ${sectionId}:`, error);
    } finally {
      this.initializationInProgress.delete(sectionId);
    }
  }

  // ÉTAPE 6: Méthodes d'initialisation COMPLÈTES avec protection renforcée

  async initializeFamiliesComplete() {
    console.log('👨‍👩‍👧‍👦 ÉTAPE 6: Init familles COMPLÈTE');

    try {
      // PROTECTION SPÉCIALE pour les familles - le plus problématique
      const familyKey = 'epci-families-maps';
      if (window.initializationGuard && window.initializationGuard[familyKey]) {
        console.log('🛡️ EpciFamiliesMaps déjà initialisé, abandon');
        return;
      }

      // Marquer comme en cours d'initialisation
      if (!window.initializationGuard) window.initializationGuard = {};
      window.initializationGuard[familyKey] = true;

      // Initialiser les cartes des familles avec délais
      if (typeof window.initializeFamiliesMap === 'function') {
        console.log('🗺️ Initialisation carte couples avec enfants');
        window.initializeFamiliesMap();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (typeof window.initializeSingleParentMap === 'function') {
        console.log('🗺️ Initialisation carte familles monoparentales');
        window.initializeSingleParentMap();
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (typeof window.initializeLargeFamiliesMap === 'function') {
        console.log('🗺️ Initialisation carte familles nombreuses');
        window.initializeLargeFamiliesMap();
      }

      // Fallback avec protection additionnelle
      if (typeof window.EpciFamiliesMaps === 'object' &&
          typeof window.EpciFamiliesMaps.init === 'function' &&
          !window.EpciFamiliesMaps._initialized) {

        console.log('🗺️ Fallback EpciFamiliesMaps.init');
        window.EpciFamiliesMaps.init();
        window.EpciFamiliesMaps._initialized = true; // Marquer comme initialisé
      }

    } catch (e) {
      console.error('❌ Erreur init familles complète:', e);
    }
  }

  async initializeSchoolingComplete() {
    console.log('🎓 ÉTAPE 6: Init scolarisation COMPLÈTE');

    try {
      if (typeof window.initializeMapScolarisation === 'function') {
        console.log('🗺️ Initialisation carte scolarisation 2 ans');
        window.initializeMapScolarisation();
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (typeof window.initializeMapScolarisation3to5 === 'function') {
        console.log('🗺️ Initialisation carte scolarisation 3-5 ans');
        window.initializeMapScolarisation3to5();
      }

      if (typeof window.EpciSchoolingMaps === 'object' &&
          typeof window.EpciSchoolingMaps.init === 'function' &&
          !window.EpciSchoolingMaps._initialized) {

        console.log('🗺️ Fallback EpciSchoolingMaps.init');
        window.EpciSchoolingMaps.init();
        window.EpciSchoolingMaps._initialized = true;
      }

    } catch (e) {
      console.error('❌ Erreur init scolarisation complète:', e);
    }
  }

  async initializeBirthsComplete() {
    console.log('👶 ÉTAPE 6: Init naissances COMPLÈTE');

    try {
      if (window.EpciBirthsMap && typeof window.EpciBirthsMap.init === 'function') {
        console.log('🗺️ Initialisation carte naissances');
        window.EpciBirthsMap.init();
      } else if (typeof window.initializeBirthsCountMap === 'function') {
        window.initializeBirthsCountMap();
      }

      await new Promise(resolve => setTimeout(resolve, 200));

      if (window.EpciBirthsHistoryChart && typeof window.EpciBirthsHistoryChart.init === 'function') {
        console.log('📊 Initialisation graphique historique naissances');
        window.EpciBirthsHistoryChart.init();
      } else if (typeof window.initializeBirthsHistoryChart === 'function') {
        window.initializeBirthsHistoryChart();
      }

    } catch (e) {
      console.error('❌ Erreur init naissances complète:', e);
    }
  }

  async initializeChildrenComplete() {
    console.log('👦 ÉTAPE 6: Init enfants COMPLÈTE');

    try {
      if (typeof window.initializeChildrenMaps === 'function') {
        console.log('🗺️ Initialisation cartes enfants');
        window.initializeChildrenMaps();
      } else if (window.EpciChildrenMaps && typeof window.EpciChildrenMaps.init === 'function') {
        window.EpciChildrenMaps.init();
      }
    } catch (e) {
      console.error('❌ Erreur init enfants complète:', e);
    }
  }

  async initializePopulationComplete() {
    console.log('📢 ÉTAPE 6: Init population COMPLÈTE');

    try {
      if (typeof window.initializeAgePyramidChart === 'function') {
        console.log('📊 Initialisation pyramide des âges');
        window.initializeAgePyramidChart();
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      if (typeof window.initializePopulationHistoryChart === 'function') {
        console.log('📊 Initialisation graphique historique population');
        window.initializePopulationHistoryChart();
      } else if (window.EpciPopulationHistoryChart && typeof window.EpciPopulationHistoryChart.init === 'function') {
        window.EpciPopulationHistoryChart.init();
      }

    } catch (e) {
      console.error('❌ Erreur init population complète:', e);
    }
  }

  async initializeViolenceComplete() {
    console.log('🚨 ÉTAPE 6: Init violences COMPLÈTE');

    try {
      if (window.EpciDomesticViolenceMap && typeof window.EpciDomesticViolenceMap.init === 'function') {
        console.log('🗺️ Initialisation carte violences');
        window.EpciDomesticViolenceMap.init();
      } else if (typeof window.initializeDomesticViolenceMap === 'function') {
        window.initializeDomesticViolenceMap();
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      if (window.EpciDomesticViolenceChart && typeof window.EpciDomesticViolenceChart.init === 'function') {
        console.log('📊 Initialisation graphique violences');
        window.EpciDomesticViolenceChart.init();
      } else if (typeof window.initializeEpciDomesticViolenceChart === 'function') {
        window.initializeEpciDomesticViolenceChart();
      }

    } catch (e) {
      console.error('❌ Erreur init violences complète:', e);
    }
  }

  async initializeEconomicComplete() {
    console.log('💰 ÉTAPE 6: Init économie COMPLÈTE');
    try {
      if (typeof window.initializeEconomicMaps === 'function') {
        window.initializeEconomicMaps();
      }
    } catch (e) {
      console.error('❌ Erreur économie complète:', e);
    }
  }

  async initializeChildcareComplete() {
    console.log('🍼 ÉTAPE 6: Init petite enfance COMPLÈTE');
    try {
      if (typeof window.initializeChildcareMap === 'function') {
        window.initializeChildcareMap();
      }
    } catch (e) {
      console.error('❌ Erreur petite enfance complète:', e);
    }
  }

  async initializeFamilyEmploymentComplete() {
    console.log('💼 ÉTAPE 6: Init emploi familles COMPLÈTE');
    try {
      if (window.EpciFamilyEmploymentChart && typeof window.EpciFamilyEmploymentChart.init === 'function') {
        window.EpciFamilyEmploymentChart.init();
      } else if (typeof window.initializeEpciFamilyEmploymentCharts === 'function') {
        window.initializeEpciFamilyEmploymentCharts();
      }
    } catch (e) {
      console.error('❌ Erreur emploi familles complète:', e);
    }
  }

  async initializeWomenEmploymentComplete() {
    console.log('👩‍💼 ÉTAPE 6: Init emploi femmes COMPLÈTE');
    try {
      if (typeof window.initializeWomenEmploymentMaps === 'function') {
        window.initializeWomenEmploymentMaps();
      }
    } catch (e) {
      console.error('❌ Erreur emploi femmes complète:', e);
    }
  }

  getLoadingStats() {
    return {
      loadedSections: Array.from(this.loadedSections),
      sectionsInProgress: Array.from(this.requestInProgress),
      queuedRequests: Array.from(this.requestQueue.keys()),
      initializationInProgress: Array.from(this.initializationInProgress),
      componentsInitialized: Array.from(this.componentsInitialized),
      totalSections: Object.keys(this.sectionEndpoints).length
    };
  }
}

// Instance unique sécurisée
if (!window.asyncSectionLoader) {
  window.asyncSectionLoader = new AsyncSectionLoader();
}

export default AsyncSectionLoader;
