// app/javascript/controllers/tabs_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tab", "panel"]
  static values = { defaultTab: String }

  connect() {
    // Restaurer l'onglet sauvegardé ou utiliser l'onglet par défaut
    const storedTab = this.getStoredActiveTab()
    const defaultTabId = storedTab || this.defaultTabValue || this.tabTargets[0]?.dataset.tabId

    if (defaultTabId) {
      this.showTab(defaultTabId)
    }
  }

  switch(event) {
    event.preventDefault()
    const tabId = event.currentTarget.dataset.tabId
    this.showTab(tabId)
  }

  showTab(tabId) {
    // Désactiver tous les onglets
    this.tabTargets.forEach(tab => {
      // Retirer la classe d'état actif personnalisée
      tab.classList.remove("tab-active");
      // Ajouter les classes d'état inactif SANS hover:text-gray-700
      tab.classList.add("text-gray-500", "border-transparent");
    });

    // Masquer tous les panneaux
    this.panelTargets.forEach(panel => {
      panel.classList.add("hidden");
    });

    // Activer l'onglet sélectionné
    const activeTab = this.tabTargets.find(tab => tab.dataset.tabId === tabId);
    if (activeTab) {
      // Retirer les classes d'état inactif
      activeTab.classList.remove("text-gray-500", "border-transparent");
      // Ajouter la classe d'état actif personnalisée
      activeTab.classList.add("tab-active");
    }

    // Afficher le panneau correspondant
    const activePanel = this.panelTargets.find(panel => panel.dataset.tabId === tabId);
    if (activePanel) {
      activePanel.classList.remove("hidden");

      // Solution simple : redimensionnement direct après un délai
      setTimeout(() => {
        this.resizeAllMaps();
      }, 100);
    }

    // Sauvegarder l'onglet actif dans le localStorage
    localStorage.setItem('epci-dashboard-active-tab', tabId);
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
