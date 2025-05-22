class MapManager {
  constructor() {
    this.maps = new Map()
    this.initEventListeners()
  }

  // Enregistrer une carte
  registerMap(elementId, mapInstance) {
    this.maps.set(elementId, mapInstance)
    console.log(`Carte enregistrée: ${elementId}`)
  }

  // Récupérer une carte
  getMap(elementId) {
    return this.maps.get(elementId)
  }

  // Redimensionner toutes les cartes visibles
  resizeVisibleMaps() {
    this.maps.forEach((map, elementId) => {
      const element = document.getElementById(elementId)
      if (element && !element.closest('.hidden') && map && map.invalidateSize) {
        try {
          map.invalidateSize(true)
          console.log(`Carte redimensionnée: ${elementId}`)
        } catch (error) {
          console.warn(`Erreur redimensionnement carte ${elementId}:`, error)
        }
      }
    })
  }

  // Redimensionner une carte spécifique
  resizeMap(elementId) {
    const map = this.maps.get(elementId)
    const element = document.getElementById(elementId)

    if (map && element && !element.closest('.hidden') && map.invalidateSize) {
      try {
        map.invalidateSize(true)
        console.log(`Carte redimensionnée: ${elementId}`)
      } catch (error) {
        console.warn(`Erreur redimensionnement carte ${elementId}:`, error)
      }
    }
  }

  // Écouter les événements de changement d'onglet
  initEventListeners() {
    document.addEventListener('tab-changed', (event) => {
      if (event.detail.action === 'resize-maps') {
        // Utiliser plusieurs tentatives avec des délais
        setTimeout(() => this.resizeVisibleMaps(), 50)
        setTimeout(() => this.resizeVisibleMaps(), 150)
        setTimeout(() => this.resizeVisibleMaps(), 300)
      }
    })
  }

  // Nettoyer les références de cartes détruites
  cleanup() {
    this.maps.forEach((map, elementId) => {
      const element = document.getElementById(elementId)
      if (!element) {
        this.maps.delete(elementId)
      }
    })
  }
}

// Créer une instance globale
window.mapManager = new MapManager()

export default window.mapManager
