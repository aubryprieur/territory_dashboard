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

    // ✅ AJOUT : Système de monitoring des performances
    this.performanceMetrics = new Map(); // Pour stocker les temps de chargement
    this.performanceEnabled = true; // Mettre à false pour désactiver en production

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

    // ✅ AJOUT : Injecter les styles pour les badges de performance
    this.injectPerformanceStyles();

    this.initializeEventListeners();
    console.log('🚀 AsyncSectionLoader ÉTAPE 6 COMPLÈTE - Tous graphiques restaurés');
  }

  // Après le constructeur, avant initializeEventListeners()
  injectPerformanceStyles() {
    if (document.getElementById('perf-monitor-styles')) return;

    const style = document.createElement('style');
    style.id = 'perf-monitor-styles';
    style.textContent = `
      .perf-badge {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        color: white;
      }

      .perf-badge.fast { background: #10b981; }
      .perf-badge.medium { background: #f59e0b; }
      .perf-badge.slow { background: #ef4444; }

      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }

      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
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

    // ✅ AJOUT : Tracking début
    if (this.performanceEnabled) {
      console.log(`🔍 [Performance] Début chargement: ${sectionId}`);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn(`⏰ Timeout pour ${sectionId} après 30s`);
        controller.abort();
      }, 30000);

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

      // ✅ AJOUT : Calcul du temps total et affichage
      const totalDuration = Date.now() - startTime;
      this.showPerformanceBadge(sectionId, totalDuration);
      this.storeMetric(sectionId, totalDuration);

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

      // ✨ NOUVEAU: Redimensionner après injection du contenu
      this.resizeLoadedContent();

      const event = new CustomEvent('dashboard:sectionLoaded', {
        detail: { section: sectionId, timestamp: Date.now() }
      });
      document.dispatchEvent(event);

      console.log(`📝 ÉTAPE 6: Contenu injecté pour ${sectionId}`);
    } else {
      console.error(`❌ Container non trouvé pour: ${sectionId}`);
    }
  }

  resizeLoadedContent() {
    console.log('🔄 Redimensionnement du contenu chargé');

    // Redimensionner les cartes Leaflet
    if (window.leafletMaps && window.leafletMaps.size > 0) {
      window.leafletMaps.forEach((map, elementId) => {
        const element = document.getElementById(elementId);

        if (element && !element.closest('.hidden') && map && map.invalidateSize) {
          try {
            map.invalidateSize(true);

            // Repositionner avec les bounds stockés
            if (window.mapBounds && window.mapBounds.has(elementId)) {
              const bounds = window.mapBounds.get(elementId);
              if (bounds && bounds.isValid()) {
                map.fitBounds(bounds);
              }
            }

            console.log(`✅ Carte redimensionnée: ${elementId}`);
          } catch (error) {
            console.warn(`⚠️ Erreur redimensionnement carte ${elementId}:`, error);
          }
        }
      });
    }

    // Redimensionner les graphiques Chart.js
    if (window.chartInstances && window.chartInstances.size > 0) {
      window.chartInstances.forEach((chart, elementId) => {
        const element = document.getElementById(elementId);

        if (element && !element.closest('.hidden') && chart && chart.resize) {
          try {
            chart.resize();
            console.log(`✅ Graphique redimensionné: ${elementId}`);
          } catch (error) {
            console.warn(`⚠️ Erreur redimensionnement graphique ${elementId}:`, error);
          }
        }
      });
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
    console.log('Familles: Init complète avec diagnostic');

    // Diagnostic des éléments DOM
    const requiredElements = [
      'communes-map-families', 'communes-families-geojson',
      'communes-map-single-parent', 'communes-single-parent-geojson',
      'communes-map-large-families', 'communes-large-families-geojson'
    ];

    let allPresent = true;
    requiredElements.forEach(id => {
      const element = document.getElementById(id);
      if (!element) {
        console.error(`Element manquant: ${id}`);
        allPresent = false;
      } else if (id.includes('geojson')) {
        try {
          const data = JSON.parse(element.textContent);
          console.log(`${id}: ${data.features?.length || 0} features`);
        } catch (e) {
          console.error(`JSON invalide: ${id}`);
          allPresent = false;
        }
      }
    });

    if (!allPresent) return;

    // Attendre stabilisation
    await new Promise(resolve => setTimeout(resolve, 800));

    // Nettoyer cartes existantes
    ['communes-map-families', 'communes-map-single-parent', 'communes-map-large-families']
      .forEach(mapId => {
        const element = document.getElementById(mapId);
        if (element?._leaflet_id) {
          if (window.leafletMaps?.has(mapId)) {
            window.leafletMaps.get(mapId).remove();
            window.leafletMaps.delete(mapId);
          }
          delete element._leaflet_id;
          element.innerHTML = '';
        }
      });

    // Initialiser séquentiellement
    if (typeof window.initializeFamiliesMap === 'function') {
      window.initializeFamiliesMap();
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    if (typeof window.initializeSingleParentMap === 'function') {
      window.initializeSingleParentMap();
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    if (typeof window.initializeLargeFamiliesMap === 'function') {
      window.initializeLargeFamiliesMap();
    }
  }

  async initializeSchoolingComplete() {
    console.log('🎓 ÉTAPE 6: Init scolarisation COMPLÈTE');

    try {
      // Appel direct à EpciSchoolingMaps (comme pour les autres sections qui fonctionnent)
      if (window.EpciSchoolingMaps && typeof window.EpciSchoolingMaps.init === 'function') {
        console.log('🗺️ Initialisation cartes scolarisation');
        window.EpciSchoolingMaps.init();
      } else {
        console.warn('⚠️ EpciSchoolingMaps non disponible');
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

  // Ajouter avant getLoadingStats()

  showPerformanceBadge(sectionId, duration) {
    if (!this.performanceEnabled) return;

    // Déterminer la couleur selon le temps
    let badgeClass = 'fast';
    if (duration > 5000) badgeClass = 'slow';
    else if (duration > 2000) badgeClass = 'medium';

    // Nom lisible de l'onglet
    const sectionNames = {
      'population': 'Population',
      'families': 'Familles',
      'births': 'Naissances',
      'children': 'Enfants',
      'schooling': 'Scolarisation',
      'economy': 'Économie',
      'childcare': 'Petite enfance',
      'family-employment': 'Emploi familles',
      'women-employment': 'Emploi femmes',
      'violence': 'Violences'
    };

    const displayName = sectionNames[sectionId] || sectionId;

    // Log console avec couleur
    const color = badgeClass === 'fast' ? 'green' : badgeClass === 'medium' ? 'orange' : 'red';
    console.log(
      `%c✅ [Performance] "${displayName}" chargé en ${duration.toFixed(0)}ms`,
      `color: ${color}; font-weight: bold; font-size: 12px;`
    );

    // Créer le badge visuel
    const badge = document.createElement('div');
    badge.className = `perf-badge ${badgeClass}`;
    badge.textContent = `${displayName}: ${duration.toFixed(0)}ms`;

    document.body.appendChild(badge);

    // Retirer après 3 secondes
    setTimeout(() => {
      badge.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => badge.remove(), 300);
    }, 3000);
  }

  storeMetric(sectionId, duration) {
    if (!this.performanceMetrics.has(sectionId)) {
      this.performanceMetrics.set(sectionId, []);
    }

    const metrics = this.performanceMetrics.get(sectionId);
    metrics.push({
      duration,
      timestamp: new Date().toISOString()
    });

    // Garder seulement les 10 dernières mesures
    if (metrics.length > 10) {
      metrics.shift();
    }
  }

  getPerformanceStats() {
    const stats = {};

    this.performanceMetrics.forEach((metrics, sectionId) => {
      const durations = metrics.map(m => m.duration);
      stats[sectionId] = {
        count: durations.length,
        average: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(0),
        min: Math.min(...durations).toFixed(0),
        max: Math.max(...durations).toFixed(0),
        last: durations[durations.length - 1]?.toFixed(0)
      };
    });

    return stats;
  }

  getLoadingStats() {
    return {
      loadedSections: Array.from(this.loadedSections),
      sectionsInProgress: Array.from(this.requestInProgress),
      queuedRequests: Array.from(this.requestQueue.keys()),
      initializationInProgress: Array.from(this.initializationInProgress),
      componentsInitialized: Array.from(this.componentsInitialized),
      totalSections: Object.keys(this.sectionEndpoints).length,
      performanceStats: this.getPerformanceStats()
    };
  }
}

// Instance unique sécurisée
if (!window.asyncSectionLoader) {
  window.asyncSectionLoader = new AsyncSectionLoader();
}

// ===== NETTOYAGE POUR TURBO NAVIGATION =====
document.addEventListener('turbo:before-cache', () => {
  console.log('🧹 Turbo:before-cache - Nettoyage global');

  // 0️⃣ Réinitialiser les gardes Families et Children
  if (window.familiesMapsGuard) {
    window.familiesMapsGuard.globalInit = false;
    window.familiesMapsGuard.initialized.clear();
    window.familiesMapsGuard.inProgress.clear();
    console.log('✅ familiesMapsGuard réinitialisé');
  }

  if (window.childrenMapsGuard) {
    window.childrenMapsGuard.globalInit = false;
    window.childrenMapsGuard.initialized.clear();
    window.childrenMapsGuard.inProgress.clear();
    console.log('✅ childrenMapsGuard réinitialisé');
  }

  // 1️⃣ Nettoyer les cartes Leaflet - SEULEMENT celles orphelines
  if (window.leafletMaps && window.leafletMaps.size > 0) {
    const orphanedMaps = [];

    window.leafletMaps.forEach((map, elementId) => {
      try {
        const element = document.getElementById(elementId);
        // Si l'élément n'existe pas dans le DOM, nettoyer la carte
        if (!element) {
          if (map && map.remove) {
            map.remove();
          }
          orphanedMaps.push(elementId);
          console.log(`✅ Carte orpheline ${elementId} supprimée`);
        }
      } catch (e) {
        console.warn(`⚠️ Erreur nettoyage carte ${elementId}:`, e);
      }
    });

    // Supprimer seulement les cartes orphelines
    orphanedMaps.forEach(mapId => window.leafletMaps.delete(mapId));
  }

  // 2️⃣ Nettoyer les graphiques Chart.js - SEULEMENT ceux orphelins
  if (window.chartInstances && window.chartInstances.size > 0) {
    const orphanedCharts = [];

    window.chartInstances.forEach((chart, elementId) => {
      try {
        const element = document.getElementById(elementId);
        // Si l'élément n'existe pas, nettoyer le graphique
        if (!element) {
          if (chart && chart.destroy) {
            chart.destroy();
          }
          orphanedCharts.push(elementId);
          console.log(`✅ Graphique orphelin ${elementId} supprimé`);
        }
      } catch (e) {
        console.warn(`⚠️ Erreur nettoyage graphique ${elementId}:`, e);
      }
    });

    // Supprimer seulement les graphiques orphelins
    orphanedCharts.forEach(chartId => window.chartInstances.delete(chartId));
  }

  // 3️⃣ Réinitialiser AsyncSectionLoader
  if (window.asyncSectionLoader) {
    window.asyncSectionLoader.loadedSections.clear();
    window.asyncSectionLoader.requestInProgress.clear();
    window.asyncSectionLoader.requestQueue.clear();
    window.asyncSectionLoader.initializationInProgress.clear();
    window.asyncSectionLoader.componentsInitialized.clear();
    console.log('✅ AsyncSectionLoader réinitialisé');
  }

  console.log('✅ Nettoyage Turbo complété');
});

// Réinitialiser aussi après le chargement d'une nouvelle page
document.addEventListener('turbo:load', () => {
  console.log('🔄 Turbo:load - Nouvelle page chargée');

  // Vérifier si on est sur une nouvelle page EPCI
  const isEpciDashboard = document.querySelector('[data-controller="tabs"]');
  if (isEpciDashboard) {
    console.log('📄 Page EPCI Dashboard détectée');
    // Le AsyncSectionLoader et Stimulus se réinitialisent automatiquement
  }
});

export default AsyncSectionLoader;
