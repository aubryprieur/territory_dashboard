// app/javascript/controllers/tabs_controller.js

import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tab", "panel"]
  static values = { defaultTab: String }

  connect() {
    const defaultTabId = 'accueil';
    if (defaultTabId) {
      this.showTab(defaultTabId)
    }
    localStorage.removeItem('epci-dashboard-active-tab');
  }

  switch(event) {
    event.preventDefault()
    const tabId = event.currentTarget.dataset.tabId

    // ✨ NOUVEAU: Déclencher le chargement asynchrone AVANT showTab
    this.triggerAsyncLoad(tabId)

    // Afficher le panneau (vide ou avec loader)
    this.showTab(tabId)

    // Scroll vers la nav
    setTimeout(() => {
      const tabsNavigation = document.getElementById('tabs-navigation');
      if (tabsNavigation) {
        tabsNavigation.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 50);
  }

  // ========== MÉTHODE 1️⃣ : Vérifier si panneau est vide ==========
  isPanelEmpty(panel) {
    const content = panel.innerHTML
      .trim()
      .replace(/<!--[\s\S]*?-->/g, '') // ✨ Supprime les commentaires HTML
      .trim()

    return content === '' || content === '<div class="async-loader"></div>'
  }

  // ========== MÉTHODE 2️⃣ : Afficher le loader temporaire ==========
  showTemporaryLoader(panel, sectionId) {
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
      'violence': 'violences domestiques',
      'accueil': 'accueil'
    }

    const sectionName = sectionNames[sectionId] || 'données'

    const loader = document.createElement('div')
    loader.className = 'async-loader flex items-center justify-center h-96 py-12'
    loader.innerHTML = `
      <div class="text-center">
        <!-- Spinner rotatif -->
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>

        <!-- Texte -->
        <p class="text-gray-600 font-medium">Chargement ${sectionName}...</p>

        <!-- Barre de progression -->
        <div class="w-32 bg-gray-200 rounded-full h-1 mt-4 mx-auto overflow-hidden">
          <div class="bg-indigo-600 h-1 rounded-full animate-pulse"></div>
        </div>
      </div>
    `

    // Remplacer le contenu seulement s'il est vide
    if (this.isPanelEmpty(panel)) {
      panel.innerHTML = ''
      panel.appendChild(loader)
    }
  }

  // ========== MÉTHODE 3️⃣ : Redimensionner cartes + graphiques ==========
  resizeAllMaps() {
    console.log('🔄 Redimensionnement des cartes et graphiques')

    // 🗺️ Redimensionner les cartes Leaflet
    if (window.leafletMaps && window.leafletMaps.size > 0) {
      window.leafletMaps.forEach((map, elementId) => {
        const element = document.getElementById(elementId);

        if (element && !element.closest('.hidden') && map && map.invalidateSize) {
          try {
            // ✅ Redimensionner d'abord
            map.invalidateSize(true);

            // ✅ Puis repositionner avec les bounds stockés
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

    // 📊 Redimensionner les graphiques Chart.js
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

  triggerAsyncLoad(tabId) {
    if (window.asyncSectionLoader) {
      console.log(`🎯 Déclenchement chargement: ${tabId}`)
      window.asyncSectionLoader.loadSectionIfNeeded(tabId)
    }
  }

  showTab(tabId) {
    // Désactiver tous les onglets
    this.tabTargets.forEach(tab => {
      tab.classList.remove("tab-active");
      tab.classList.add("text-gray-500", "border-transparent");
    });

    // Masquer tous les panneaux
    this.panelTargets.forEach(panel => {
      panel.classList.add("hidden");
    });

    // Activer l'onglet sélectionné
    const activeTab = this.tabTargets.find(tab => tab.dataset.tabId === tabId);
    if (activeTab) {
      activeTab.classList.remove("text-gray-500", "border-transparent");
      activeTab.classList.add("tab-active");
    }

    // Afficher le panneau correspondant
    const activePanel = this.panelTargets.find(panel => panel.dataset.tabId === tabId);
    if (activePanel) {
      activePanel.classList.remove("hidden");

      // ✨ NOUVEAU: Vérifier si le contenu est vide et afficher un loader
      if (this.isPanelEmpty(activePanel) && window.asyncSectionLoader) {
        console.log(`📦 Panneau vide pour ${tabId}, affichage du loader`)
        this.showTemporaryLoader(activePanel, tabId)
      }

      // Redimensionner après un délai (pour laisser le temps au DOM de se mettre à jour)
      setTimeout(() => {
        this.resizeAllMaps();
      }, 100);
    }

    // Sauvegarder l'onglet actif
    localStorage.setItem('epci-dashboard-active-tab', tabId);
  }

  // Restaurer l'onglet depuis localStorage
  getStoredActiveTab() {
    return localStorage.getItem('epci-dashboard-active-tab')
  }
}
