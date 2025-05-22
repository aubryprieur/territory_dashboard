// app/javascript/utils/initialization_guard.js
class InitializationGuard {
  constructor() {
    this.initialized = new Set()
    this.maps = new Map()
    this.charts = new Map()
  }

  // Vérifier si un élément a déjà été initialisé
  isInitialized(elementId) {
    return this.initialized.has(elementId)
  }

  // Marquer un élément comme initialisé
  markAsInitialized(elementId) {
    this.initialized.add(elementId)
  }

  // Nettoyer les cartes existantes
  cleanupMap(elementId) {
    const element = document.getElementById(elementId)
    if (!element) return

    // Nettoyer Leaflet
    if (element._leaflet_id) {
      try {
        const map = this.maps.get(elementId)
        if (map && map.remove) {
          map.remove()
        }
        // Nettoyer les références Leaflet
        delete element._leaflet_id
        element.innerHTML = ''
      } catch (error) {
        console.warn(`Erreur nettoyage carte ${elementId}:`, error)
      }
    }

    this.maps.delete(elementId)
    this.initialized.delete(elementId)
  }

  // Nettoyer les graphiques existants
  cleanupChart(elementId) {
    try {
      const existingChart = Chart.getChart(elementId)
      if (existingChart) {
        existingChart.destroy()
      }
    } catch (error) {
      console.warn(`Erreur nettoyage graphique ${elementId}:`, error)
    }

    this.charts.delete(elementId)
    this.initialized.delete(elementId)
  }

  // Enregistrer une carte
  registerMap(elementId, mapInstance) {
    this.maps.set(elementId, mapInstance)
    this.markAsInitialized(elementId)
  }

  // Enregistrer un graphique
  registerChart(elementId, chartInstance) {
    this.charts.set(elementId, chartInstance)
    this.markAsInitialized(elementId)
  }

  // Nettoyer tout au changement de page
  cleanupAll() {
    // Nettoyer les cartes
    this.maps.forEach((map, elementId) => {
      this.cleanupMap(elementId)
    })

    // Nettoyer les graphiques
    this.charts.forEach((chart, elementId) => {
      this.cleanupChart(elementId)
    })

    this.initialized.clear()
  }
}

// Instance globale
window.initGuard = new InitializationGuard()

// Nettoyer avant chaque nouvelle page Turbo
document.addEventListener('turbo:before-cache', () => {
  window.initGuard.cleanupAll()
})

export default window.initGuard
