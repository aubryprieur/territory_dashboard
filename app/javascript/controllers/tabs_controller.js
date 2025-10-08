// app/javascript/controllers/tabs_controller.js - ÉTAPE 2: Synchronisation avec l'async loader

import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tab", "panel"]
  static values = { defaultTab: String }

  connect() {
    // ✅ Toujours rediriger vers l'onglet Accueil
    const defaultTabId = 'accueil';

    if (defaultTabId) {
      this.showTab(defaultTabId)
    }

    // Nettoyer l'ancien localStorage
    localStorage.removeItem('epci-dashboard-active-tab');
  }

  switch(event) {
    event.preventDefault()
    const tabId = event.currentTarget.dataset.tabId

    // CORRECTION ÉTAPE 2: Déclencher immédiatement le chargement asynchrone
    this.triggerAsyncLoad(tabId)

    this.showTab(tabId)

    // ✅ Scroll vers la barre de navigation des onglets
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

  // NOUVELLE MÉTHODE: Déclencher le chargement asynchrone sans attendre
  triggerAsyncLoad(tabId) {
    if (window.asyncSectionLoader) {
      console.log(`🎯 Déclenchement immédiat du chargement: ${tabId}`)
      // Appeler directement sans debounce
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

      // CORRECTION ÉTAPE 2: Vérifier si le contenu est vide et afficher un loader temporaire
      if (this.isPanelEmpty(activePanel) && window.asyncSectionLoader) {
        this.showTemporaryLoader(activePanel, tabId)
      }

      // Solution simple : redimensionnement direct après un délai
      setTimeout(() => {
        this.resizeAllMaps();
      }, 100);
    }

    // Sauvegarder l'onglet actif dans le localStorage
    localStorage.setItem('epci-dashboard-active-tab', tabId);
  }

  // NOUVELLE MÉTHODE: Vérifier si un panneau est vide
  isPanelEmpty(panel) {
    const content = panel.innerHTML.trim()
    return content === '' || content === '<div class="async-loader"></div>'
  }

  // NOUVELLE MÉTHODE: Afficher un loader temporaire
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
      'violence': 'violences domestiques'
    }

    const sectionName = sectionNames[sectionId] || 'données'

    const loader = document.createElement('div')
    loader.className = 'async-loader flex items-center justify-center h-64'
    loader.innerHTML = `
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Chargement ${sectionName}...</p>
        <div class="w-32 bg-gray-200 rounded-full h-1 mt-2 mx-auto overflow-hidden">
          <div class="bg-blue-600 h-1 rounded-full animate-pulse"></div>
        </div>
      </div>
    `

    // Remplacer le contenu seulement s'il est vide
    if (this.isPanelEmpty(panel)) {
      panel.innerHTML = ''
      panel.appendChild(loader)
    }
  }

  resizeAllMaps() {
    // Redimensionner les cartes avec bounds stockés
    if (window.leafletMaps) {
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

            console.log(`Carte redimensionnée et repositionnée: ${elementId}`);
          } catch (error) {
            console.warn(`Erreur redimensionnement carte ${elementId}:`, error);
          }
        }
      });
    }

    // Redimensionner les graphiques Chart.js
    if (window.chartInstances) {
      window.chartInstances.forEach((chart, elementId) => {
        const element = document.getElementById(elementId);
        if (element && !element.closest('.hidden') && chart && chart.resize) {
          try {
            chart.resize();
            console.log(`Graphique redimensionné: ${elementId}`);
          } catch (error) {
            console.warn(`Erreur redimensionnement graphique ${elementId}:`, error);
          }
        }
      });
    }
  }

  // Restaurer l'onglet actif depuis le localStorage
  getStoredActiveTab() {
    return localStorage.getItem('epci-dashboard-active-tab')
  }

  switchFromSelect(event) {
    const tabId = event.target.value
    this.showTab(tabId)
  }
}
