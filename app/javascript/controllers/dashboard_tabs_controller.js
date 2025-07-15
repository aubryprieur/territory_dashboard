// app/javascript/controllers/dashboard_tabs_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tab", "content"]
  static values = { defaultTab: String }

  connect() {
    console.log("🚀 Dashboard tabs controller connecté")

    // Restaurer l'onglet sauvegardé ou utiliser l'onglet par défaut
    const storedTab = this.getStoredActiveTab()
    const defaultTabId = storedTab || this.defaultTabValue || 'synthese'

    if (defaultTabId) {
      this.showTab({ currentTarget: { dataset: { tab: defaultTabId } } })
    }

    // Initialiser le système de défilement des onglets
    this.initializeTabsScroll()
  }

  disconnect() {
    console.log("🔌 Dashboard tabs controller déconnecté")
  }

  showTab(event) {
    if (event.preventDefault) {
      event.preventDefault()
    }

    const tabName = event.currentTarget.dataset.tab
    console.log(`🔄 Changement d'onglet vers: ${tabName}`)

    // Désactiver tous les onglets
    this.tabTargets.forEach(tab => {
      // ✅ CORRECTION: Utiliser la classe tab-active comme dans le CSS
      tab.classList.remove("tab-active")
      // Remettre les couleurs de base (gris)
      tab.classList.add("text-gray-600")
      tab.classList.remove("text-blue-600")
    })

    // Masquer tous les contenus
    this.contentTargets.forEach(content => {
      content.classList.add("hidden")
    })

    // Activer l'onglet sélectionné
    const activeTab = this.tabTargets.find(tab => tab.dataset.tab === tabName)
    if (activeTab) {
      // ✅ CORRECTION: Ajouter la classe tab-active (le CSS s'occupe du style)
      activeTab.classList.add("tab-active")
      // Retirer la couleur grise pour laisser le CSS gérer
      activeTab.classList.remove("text-gray-600")
    }

    // Afficher le contenu correspondant
    const activeContent = this.contentTargets.find(content => content.dataset.tab === tabName)
    if (activeContent) {
      activeContent.classList.remove("hidden")

      // Déclencher le chargement asynchrone de la section si pas encore chargée
      this.triggerSectionLoad(tabName)

      // Redimensionner les éléments après un délai
      setTimeout(() => {
        this.resizeVisibleElements()
      }, 100)
    }

    // Sauvegarder l'onglet actif
    localStorage.setItem('dashboard-active-tab', tabName)

    // Déclencher l'événement de changement d'onglet
    const changeEvent = new CustomEvent('dashboard:tabChanged', {
      detail: { section: tabName }
    })
    document.dispatchEvent(changeEvent)
  }

  triggerSectionLoad(sectionName) {
    // Déclencher le chargement asynchrone de la section
    const loadEvent = new CustomEvent('dashboard:loadSection', {
      detail: { section: sectionName }
    })
    document.dispatchEvent(loadEvent)
  }

  resizeVisibleElements() {
    // Redimensionner les cartes Leaflet visibles
    if (window.leafletMaps) {
      window.leafletMaps.forEach((map, elementId) => {
        const element = document.getElementById(elementId)
        if (element && !element.closest('.hidden') && map && map.invalidateSize) {
          try {
            map.invalidateSize(true)

            // Repositionner avec les bounds stockés
            if (window.mapBounds && window.mapBounds.has(elementId)) {
              const bounds = window.mapBounds.get(elementId)
              if (bounds && bounds.isValid()) {
                map.fitBounds(bounds)
              }
            }

            console.log(`✅ Carte redimensionnée: ${elementId}`)
          } catch (error) {
            console.warn(`⚠️ Erreur redimensionnement carte ${elementId}:`, error)
          }
        }
      })
    }

    // Redimensionner les graphiques Chart.js visibles
    if (window.chartInstances) {
      window.chartInstances.forEach((chart, elementId) => {
        const element = document.getElementById(elementId)
        if (element && !element.closest('.hidden') && chart && chart.resize) {
          try {
            chart.resize()
            console.log(`✅ Graphique redimensionné: ${elementId}`)
          } catch (error) {
            console.warn(`⚠️ Erreur redimensionnement graphique ${elementId}:`, error)
          }
        }
      })
    }
  }

  // Restaurer l'onglet actif depuis le localStorage
  getStoredActiveTab() {
    return localStorage.getItem('dashboard-active-tab')
  }

  // Initialiser le système de défilement des onglets avec flèches
  initializeTabsScroll() {
    // Récupérer les éléments
    this.tabsContainer = document.getElementById('dashboard-tabs-container')
    this.scrollLeftBtn = document.getElementById('dashboard-scroll-left')
    this.scrollRightBtn = document.getElementById('dashboard-scroll-right')
    this.gradientLeft = document.getElementById('dashboard-gradient-left')
    this.gradientRight = document.getElementById('dashboard-gradient-right')

    if (!this.tabsContainer || !this.scrollLeftBtn || !this.scrollRightBtn) {
      console.warn('⚠️ Éléments de scroll des onglets dashboard non trouvés')
      return
    }

    console.log("🎯 Initialisation du système de défilement des onglets")

    // Ajouter les event listeners pour les boutons
    this.scrollLeftBtn.addEventListener('click', this.scrollLeft.bind(this))
    this.scrollRightBtn.addEventListener('click', this.scrollRight.bind(this))

    // Ajouter les event listeners pour le scroll automatique
    this.tabsContainer.addEventListener('scroll', this.checkScroll.bind(this))
    window.addEventListener('resize', this.checkScroll.bind(this))

    // Gérer le scroll horizontal avec la molette
    this.tabsContainer.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return // Scroll horizontal naturel
      }

      e.preventDefault()
      this.tabsContainer.scrollLeft += e.deltaY
    }, { passive: false })

    // Gérer le scroll tactile
    let startX = 0
    let scrollLeft = 0

    this.tabsContainer.addEventListener('touchstart', (e) => {
      startX = e.touches[0].pageX - this.tabsContainer.offsetLeft
      scrollLeft = this.tabsContainer.scrollLeft
    })

    this.tabsContainer.addEventListener('touchmove', (e) => {
      if (!startX) return

      e.preventDefault()
      const x = e.touches[0].pageX - this.tabsContainer.offsetLeft
      const walk = (x - startX) * 2
      this.tabsContainer.scrollLeft = scrollLeft - walk
    })

    this.tabsContainer.addEventListener('touchend', () => {
      startX = 0
    })

    // Vérification initiale après un délai pour s'assurer que le DOM est prêt
    setTimeout(() => this.checkScroll(), 100)
  }

  // Faire défiler vers la gauche
  scrollLeft() {
    console.log("⬅️ Scroll gauche")
    this.tabsContainer.scrollBy({ left: -200, behavior: 'smooth' })
  }

  // Faire défiler vers la droite
  scrollRight() {
    console.log("➡️ Scroll droite")
    this.tabsContainer.scrollBy({ left: 200, behavior: 'smooth' })
  }

  // Vérifier la position de scroll et ajuster la visibilité des flèches
  checkScroll() {
    if (!this.tabsContainer || !this.scrollLeftBtn || !this.scrollRightBtn) {
      return
    }

    const scrollLeft = this.tabsContainer.scrollLeft
    const scrollWidth = this.tabsContainer.scrollWidth
    const clientWidth = this.tabsContainer.clientWidth
    const maxScroll = scrollWidth - clientWidth

    // Afficher/masquer la flèche gauche
    if (scrollLeft > 10) {
      this.scrollLeftBtn.classList.remove('opacity-0')
      this.scrollLeftBtn.classList.add('opacity-100')
      if (this.gradientLeft) {
        this.gradientLeft.classList.remove('opacity-0')
        this.gradientLeft.classList.add('opacity-100')
      }
    } else {
      this.scrollLeftBtn.classList.remove('opacity-100')
      this.scrollLeftBtn.classList.add('opacity-0')
      if (this.gradientLeft) {
        this.gradientLeft.classList.remove('opacity-100')
        this.gradientLeft.classList.add('opacity-0')
      }
    }

    // Afficher/masquer la flèche droite
    if (scrollLeft < maxScroll - 10) {
      this.scrollRightBtn.classList.remove('opacity-0')
      this.scrollRightBtn.classList.add('opacity-100')
      if (this.gradientRight) {
        this.gradientRight.classList.remove('opacity-0')
        this.gradientRight.classList.add('opacity-100')
      }
    } else {
      this.scrollRightBtn.classList.remove('opacity-100')
      this.scrollRightBtn.classList.add('opacity-0')
      if (this.gradientRight) {
        this.gradientRight.classList.remove('opacity-100')
        this.gradientRight.classList.add('opacity-0')
      }
    }
  }

  // Méthode publique pour changer d'onglet programmatiquement
  switchToTab(tabName) {
    const tab = this.tabTargets.find(t => t.dataset.tab === tabName)
    if (tab) {
      this.showTab({ currentTarget: tab })
    }
  }

  // ✅ CORRECTION: Méthode pour obtenir l'onglet actuel (utilise tab-active)
  getCurrentTab() {
    const activeTab = this.tabTargets.find(tab =>
      tab.classList.contains('tab-active')
    )
    return activeTab ? activeTab.dataset.tab : null
  }

  // Méthode pour debug
  debugState() {
    console.log("🔍 État des onglets:")
    console.log("Tabs targets:", this.tabTargets.length)
    console.log("Content targets:", this.contentTargets.length)
    console.log("Current tab:", this.getCurrentTab())

    this.tabTargets.forEach((tab, index) => {
      const isActive = tab.classList.contains('tab-active')
      console.log(`  - Onglet ${index}: ${tab.dataset.tab}, actif: ${isActive}`)
    })

    this.contentTargets.forEach((content, index) => {
      const isVisible = !content.classList.contains('hidden')
      console.log(`  - Contenu ${index}: ${content.dataset.tab}, visible: ${isVisible}`)
    })
  }
}

// Exposer pour debug
window.dashboardTabsDebug = function() {
  const controller = document.querySelector('[data-controller*="dashboard-tabs"]')
  if (controller && controller.controller) {
    controller.controller.debugState()
  }
}
