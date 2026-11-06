// app/javascript/controllers/dashboard_loader_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]
  static values = { territory: String }

  connect() {
    console.log("🚀 Dashboard loader connecté")

    // 🔧 CORRECTION : Récupérer le commune_code depuis l'URL au connect
    const urlParams = new URLSearchParams(window.location.search);
    this.communeCode = urlParams.get('commune_code');

    console.log('🔍 Commune code stocké:', this.communeCode);
    console.log('🏛️ Territory value:', this.territoryValue);

    // Écouter les événements de chargement de section
    this.loadSectionHandler = this.loadSection.bind(this);
    document.addEventListener('dashboard:loadSection', this.loadSectionHandler);
  }

  disconnect() {
    if (this.loadSectionHandler) {
      document.removeEventListener('dashboard:loadSection', this.loadSectionHandler);
    }
  }

  loadSection(event) {
    const section = event.detail.section;

    if (section === 'accueil') {
      console.log('ℹ️ Section accueil ignorée (contenu statique rendu côté serveur)');
      return;
    }

    const communeCode = event.detail.commune_code || this.communeCode;

    console.log(`🔄 Chargement section: ${section}`, {
      communeCode,
      territoryValue: this.territoryValue
    });

    // Trouver le conteneur pour cette section
    const container = document.querySelector(`[data-section="${section}"]`);
    if (!container) {
      console.warn(`❌ Container non trouvé pour la section: ${section}`);
      return;
    }

    // Vérifier si la section est déjà chargée (éviter les rechargements inutiles)
    if (container.dataset.loaded === 'true' && !container.querySelector('.animate-pulse')) {
      console.log(`✨ Section ${section} déjà chargée, ignorée`);
      return;
    }

    // Construire l'URL avec le commune_code si présent
    let url = `/dashboard/load_${section}`;
    // Tableau de bord EPCI : ?epci_code=… transmis à chaque onglet
    const epciCode = new URLSearchParams(window.location.search).get('epci_code');
    if (epciCode) {
      url += `?epci_code=${encodeURIComponent(epciCode)}`;
    } else if (communeCode) {
      url += `?commune_code=${encodeURIComponent(communeCode)}`;
    }

    console.log(`📡 Requête AJAX: ${url}`);

    // Marquer le container comme en cours de chargement
    container.dataset.loading = 'true';

    // Effectuer la requête AJAX
    fetch(url, {
      headers: {
        'Accept': 'text/html',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    })
    .then(html => {
      console.log(`✅ Section ${section} chargée avec succès`);

      // Remplacer le contenu
      container.innerHTML = html;

      // Marquer comme chargé
      container.dataset.loaded = 'true';
      container.dataset.loading = 'false';

      // Déclencher un événement personnalisé pour signaler que la section est chargée
      const loadedEvent = new CustomEvent('dashboard:sectionLoaded', {
        detail: { section, container, communeCode }
      });
      document.dispatchEvent(loadedEvent);

      // Initialiser les graphiques si nécessaire
      this.initializeCharts(container, section);
    })
    .catch(error => {
      console.error(`❌ Erreur lors du chargement de ${section}:`, error);

      container.dataset.loading = 'false';
      container.dataset.loaded = 'false';

      container.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Erreur de chargement</h3>
              <p class="mt-1 text-sm text-red-700">
                Impossible de charger la section "${section}": ${error.message}
              </p>
              <div class="mt-3 flex space-x-3">
                <button onclick="this.closest('[data-section]').dataset.loaded='false'; document.dispatchEvent(new CustomEvent('dashboard:loadSection', {detail: {section: '${section}', commune_code: '${communeCode || ''}'}}));"
                        class="text-sm text-red-800 underline hover:text-red-900">
                  Réessayer
                </button>
                <button onclick="location.reload()"
                        class="text-sm text-red-800 underline hover:text-red-900">
                  Recharger la page
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  // Méthode pour initialiser les graphiques après le chargement
  initializeCharts(container, section) {
    try {
      // Rechercher et initialiser les graphiques Chart.js
      const chartCanvases = container.querySelectorAll('canvas[id*="chart"]');
      chartCanvases.forEach(canvas => {
        if (canvas.dataset.initialized !== 'true') {
          console.log(`🎨 Initialisation du graphique: ${canvas.id}`);
          // Le graphique sera initialisé par les scripts spécifiques à chaque section
          canvas.dataset.initialized = 'true';
        }
      });

      // Rechercher et initialiser les cartes Leaflet
      const mapContainers = container.querySelectorAll('[id*="map"]');
      mapContainers.forEach(mapContainer => {
        if (mapContainer.dataset.initialized !== 'true') {
          console.log(`🗺️ Initialisation de la carte: ${mapContainer.id}`);
          // La carte sera initialisée par les scripts spécifiques à chaque section
          mapContainer.dataset.initialized = 'true';
        }
      });

    } catch (error) {
      console.warn(`⚠️ Erreur lors de l'initialisation des graphiques pour ${section}:`, error);
    }
  }

  // Méthode utilitaire pour recharger une section
  reloadSection(section) {
    const container = document.querySelector(`[data-section="${section}"]`);
    if (container) {
      container.dataset.loaded = 'false';
      const event = new CustomEvent('dashboard:loadSection', {
        detail: { section, commune_code: this.communeCode }
      });
      document.dispatchEvent(event);
    }
  }

  // Méthode utilitaire pour recharger toutes les sections
  reloadAllSections() {
    const containers = document.querySelectorAll('[data-section]');
    containers.forEach(container => {
      const section = container.dataset.section;
      if (section) {
        container.dataset.loaded = 'false';
        setTimeout(() => {
          const event = new CustomEvent('dashboard:loadSection', {
            detail: { section, commune_code: this.communeCode }
          });
          document.dispatchEvent(event);
        }, Math.random() * 100); // Petit délai aléatoire pour éviter trop de requêtes simultanées
      }
    });
  }

  // 🔧 AJOUT : Méthode pour vider le cache et recharger
  async clearCacheAndReload() {
    if (confirm('Vider le cache et recharger les données ?')) {
      try {
        // Construire l'URL avec le commune_code si présent
        let url = '/dashboard/clear_cache';
        const epciCode = new URLSearchParams(window.location.search).get('epci_code');
        if (epciCode) {
          url += `?epci_code=${encodeURIComponent(epciCode)}`;
        } else if (this.communeCode) {
          url += `?commune_code=${encodeURIComponent(this.communeCode)}`;
        }

        console.log('🗑️ Vidage du cache:', url);

        await fetch(url, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
          }
        });

        // Marquer toutes les sections comme non chargées
        const containers = document.querySelectorAll('[data-section]');
        containers.forEach(container => {
          container.dataset.loaded = 'false';
        });

        console.log('✅ Cache vidé, rechargement des sections...');

        // Recharger la section active
        const activeTab = document.querySelector('[data-dashboard-tabs-target="tab"].tab-active');
        if (activeTab) {
          const sectionName = activeTab.dataset.tab;
          console.log(`🔄 Rechargement de la section active: ${sectionName}`);

          const event = new CustomEvent('dashboard:loadSection', {
            detail: { section: sectionName, commune_code: this.communeCode }
          });
          document.dispatchEvent(event);
        } else {
          // Si aucun onglet actif, charger la synthèse par défaut
          const event = new CustomEvent('dashboard:loadSection', {
            detail: { section: 'synthese', commune_code: this.communeCode }
          });
          document.dispatchEvent(event);
        }

      } catch (error) {
        console.error('❌ Erreur lors du vidage du cache:', error);
        alert('Erreur lors du vidage du cache. Veuillez recharger la page manuellement.');
      }
    }
  }
}
