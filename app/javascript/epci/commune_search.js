console.log("✅ commune_search.js chargé");

// Fonction globale pour ouvrir le dashboard d'une commune - VERSION CORRIGÉE
window.openCommuneDashboard = function(communeCode) {
  console.log("🚀 Ouverture dashboard commune:", communeCode);

  if (!communeCode) {
    console.error("❌ Code commune manquant");
    alert("Erreur : Code commune manquant");
    return;
  }

  // Construire l'URL avec des paramètres encodés
  const url = `/dashboard?commune_code=${encodeURIComponent(communeCode)}`;
  console.log("📍 URL dashboard:", url);

  // Ouvrir dans un nouvel onglet
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');

  // Vérifier que la fenêtre s'est bien ouverte
  if (!newWindow) {
    console.error("❌ Impossible d'ouvrir la fenêtre - popup bloqué?");
    alert("Impossible d'ouvrir le dashboard. Veuillez autoriser les popups pour ce site ou essayer en maintenant Ctrl+clic.");
    return;
  }

  console.log("✅ Dashboard ouvert avec succès");
}

// Fonction globale pour masquer les résultats de recherche
window.hideResults = function() {
  const resultsContainer = document.getElementById('commune-results');
  const searchInput = document.getElementById('commune-search');
  if (resultsContainer) resultsContainer.classList.add('hidden');
  if (searchInput) searchInput.value = '';
}

// Classe pour gérer la recherche de communes
class CommuneSearch {
  constructor(communes) {
    this.communes = communes || [];
    this.searchInput = document.getElementById('commune-search');
    this.resultsContainer = document.getElementById('commune-results');
    this.debounceTimer = null;
    this.selectedIndex = -1;

    if (!this.searchInput || !this.resultsContainer) {
      console.warn('❌ Éléments de recherche non trouvés');
      return;
    }

    // ✅ Ajouter validation des données
    if (!Array.isArray(this.communes)) {
      console.warn('❌ Données des communes invalides - doit être un tableau');
      this.communes = [];
      return;
    }

    this.init();
  }

  init() {
    console.log(`🚀 Recherche initialisée avec ${this.communes.length} communes`);

    // ✅ Arrêter l'initialisation si pas de communes
    if (this.communes.length === 0) {
      console.warn('⚠️ Aucune commune disponible pour la recherche');
      return;
    }

    // Event listeners
    this.searchInput.addEventListener('input', this.handleInput.bind(this));
    this.searchInput.addEventListener('keydown', this.handleKeydown.bind(this));
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));

    // ✅ Réinitialiser la sélection au focus
    this.searchInput.addEventListener('input', () => {
      this.selectedIndex = -1;
    });

    console.log('✅ Event listeners attachés');
  }

  handleInput(e) {
    try {
      const query = e.target.value.trim();

      clearTimeout(this.debounceTimer);

      if (query.length < 2) {
        this.resultsContainer.classList.add('hidden');
        this.selectedIndex = -1;
        return;
      }

      this.debounceTimer = setTimeout(() => {
        const results = this.searchCommunes(query);
        this.displayResults(results);
        this.resultsContainer.classList.remove('hidden');
      }, 150);
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
    }
  }

  searchCommunes(query) {
    if (!query || query.length < 2 || !Array.isArray(this.communes)) return [];

    console.log(`🔍 Recherche: "${query}"`);

    const normalizedQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filtered = this.communes.filter(commune => {
      // ✅ Validation supplémentaire des propriétés de commune
      if (!commune || !commune.name || !commune.code) return false;

      const normalizedName = commune.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizedCode = commune.code.toString().toLowerCase();

      return normalizedName.includes(normalizedQuery) || normalizedCode.includes(normalizedQuery);
    });

    // Trier par pertinence (communes qui commencent par la recherche en premier)
    filtered.sort((a, b) => {
      const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    });

    console.log(`✅ ${filtered.length} résultats trouvés`);
    return filtered.slice(0, 8); // Limiter à 8 résultats
  }

  displayResults(results) {
    if (!this.resultsContainer) return;

    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          <svg class="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          Aucune commune trouvée
        </div>
      `;
      this.selectedIndex = -1;
      this.resultsContainer.classList.remove('hidden');
      return;
    }

    const html = results.map((commune, index) => {
      // ✅ Validation et échappement des données
      const communeCode = (commune.code || '').toString().replace(/'/g, "\\'");
      const communeName = (commune.name || 'Commune inconnue').replace(/'/g, "\\'");
      const population = commune.population ? ` • ${commune.population.toLocaleString()} hab.` : '';

      return `
        <button onclick="openCommuneDashboard('${communeCode}'); window.hideResults();"
                onmouseover="this.classList.add('bg-blue-50')"
                onmouseout="this.classList.remove('bg-blue-50')"
                data-index="${index}"
                class="commune-result w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors duration-200 text-left border-b border-gray-100 last:border-b-0">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"></path>
              </svg>
            </div>
            <div>
              <div class="font-medium text-gray-900">${communeName}</div>
              <div class="text-sm text-gray-500">Code: ${communeCode}${population}</div>
            </div>
          </div>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
          </svg>
        </button>
      `;
    }).join('');

    this.resultsContainer.innerHTML = html;
    this.resultsContainer.classList.remove('hidden');
    this.selectedIndex = -1;
  }

  handleKeydown(e) {
    const results = this.resultsContainer.querySelectorAll('.commune-result');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, results.length - 1);
      this.updateSelection(results);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
      this.updateSelection(results);
    } else if (e.key === 'Enter' && this.selectedIndex >= 0 && results[this.selectedIndex]) {
      e.preventDefault();
      results[this.selectedIndex].click();
    } else if (e.key === 'Escape') {
      window.hideResults();
      this.searchInput.blur();
    }
  }

  updateSelection(results) {
    results.forEach((result, index) => {
      if (index === this.selectedIndex) {
        result.classList.add('bg-blue-50', 'selected');
        result.scrollIntoView({ block: 'nearest' });
      } else {
        result.classList.remove('bg-blue-50', 'selected');
      }
    });
  }

  handleDocumentClick(e) {
    if (!this.searchInput.contains(e.target) && !this.resultsContainer.contains(e.target)) {
      this.resultsContainer.classList.add('hidden');
      this.selectedIndex = -1;
    }
  }

  handleGlobalKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.searchInput.focus();
      this.searchInput.select();
    }
  }
}

// Fonction d'initialisation exportée - VERSION CORRIGÉE
export function initializeCommuneSearch(communes) {
  console.log("🚀 Initialisation de la recherche de communes");

  // ✅ Validation des données avant création de l'instance
  if (!communes || !Array.isArray(communes)) {
    console.error('❌ initializeCommuneSearch: données des communes invalides', communes);
    return null;
  }

  if (communes.length === 0) {
    console.warn('⚠️ initializeCommuneSearch: aucune commune fournie');
    return null;
  }

  try {
    const searchInstance = new CommuneSearch(communes);
    console.log('✅ Instance de recherche créée avec succès');
    return searchInstance;
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'instance de recherche:', error);
    return null;
  }
}
