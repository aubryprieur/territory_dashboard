// app/javascript/controllers/dashboard_loader_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container"]
  static values = { territory: String }

  connect() {
    console.log("🚀 Dashboard loader connecté")
    this.loadedSections = new Set()
    this.loadingSections = new Set()

    // Écouter les événements de changement d'onglet
    document.addEventListener('dashboard:loadSection', this.handleLoadSection.bind(this))

    // Précharger la première section après un court délai
    setTimeout(() => {
      this.loadSection('synthese')
    }, 100)
  }

  disconnect() {
    document.removeEventListener('dashboard:loadSection', this.handleLoadSection.bind(this))
  }

  handleLoadSection(event) {
    const sectionName = event.detail.section
    this.loadSection(sectionName)
  }

  async loadSection(sectionName) {
    // Éviter de charger plusieurs fois la même section
    if (this.loadedSections.has(sectionName) || this.loadingSections.has(sectionName)) {
      console.log(`📋 Section ${sectionName} déjà chargée ou en cours de chargement`)
      return
    }

    this.loadingSections.add(sectionName)
    console.log(`⏳ Chargement de la section: ${sectionName}`)

    const container = document.getElementById(`${sectionName}-content`)
    if (!container) {
      console.warn(`❌ Container non trouvé pour la section: ${sectionName}`)
      return
    }

    try {
      // Afficher un indicateur de chargement amélioré
      this.showLoadingState(container, sectionName)

      // Construire l'URL en fonction du nom de section
      const url = this.buildSectionUrl(sectionName)

      // Appel AJAX vers l'action correspondante
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const html = await response.text()

      // Animer le remplacement du contenu
      await this.animateContentReplacement(container, html)

      this.loadedSections.add(sectionName)
      console.log(`✅ Section ${sectionName} chargée avec succès`)

      // Déclencher l'initialisation des graphiques/cartes si nécessaire
      this.initializeSectionComponents(sectionName)

    } catch (error) {
      console.error(`❌ Erreur lors du chargement de ${sectionName}:`, error)
      this.showErrorState(container, sectionName)
    } finally {
      this.loadingSections.delete(sectionName)
    }
  }

  buildSectionUrl(sectionName) {
    // Correspondance entre les noms d'onglets et les routes du contrôleur
    const sectionRoutes = {
      'synthese': 'load_synthese',
      'families': 'load_families',
      'economic_data': 'load_economic_data',
      'schooling': 'load_schooling',
      'childcare': 'load_childcare',
      'employment': 'load_employment',
      'domestic_violence': 'load_domestic_violence',
      'family_employment': 'load_family_employment',
      'children_comparison': 'load_children_comparison'
    }

    const route = sectionRoutes[sectionName] || `load_${sectionName}`
    return `/dashboard/${route}`
  }

  showLoadingState(container, sectionName) {
    const loadingContent = `
      <div class="flex flex-col items-center justify-center py-12 space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 text-sm">Chargement des données ${this.getSectionDisplayName(sectionName)}...</p>
        <div class="w-64 bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full animate-pulse" style="width: 60%"></div>
        </div>
      </div>
    `
    container.innerHTML = loadingContent
  }

  showErrorState(container, sectionName) {
    const errorContent = `
      <div class="flex flex-col items-center justify-center py-12 space-y-4">
        <div class="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
          <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p class="text-red-600 text-sm font-medium">Erreur lors du chargement des données</p>
        <p class="text-gray-500 text-xs">Vérifiez votre connexion internet</p>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                onclick="document.dispatchEvent(new CustomEvent('dashboard:loadSection', {detail: {section: '${sectionName}'}}))">
          <svg class="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Réessayer
        </button>
      </div>
    `
    container.innerHTML = errorContent
  }

  async animateContentReplacement(container, newHTML) {
    // Fade out avec transform
    container.style.opacity = '0.5'
    container.style.transform = 'translateY(10px)'
    container.style.transition = 'all 0.2s ease-out'

    await new Promise(resolve => setTimeout(resolve, 200))

    // Remplacer le contenu
    container.innerHTML = newHTML

    // Fade in
    container.style.opacity = '1'
    container.style.transform = 'translateY(0)'
    container.style.transition = 'all 0.3s ease-in-out'

    await new Promise(resolve => setTimeout(resolve, 300))

    // Nettoyer les styles
    container.style.transition = ''
    container.style.transform = ''
    container.style.opacity = ''
  }

  initializeSectionComponents(sectionName) {
    // Déclencher l'initialisation spécifique selon la section
    console.log(`🔧 Initialisation des composants pour: ${sectionName}`)

    switch(sectionName) {
      case 'families':
        this.initializeFamiliesCharts()
        break
      case 'economic_data':
        this.initializeEconomicCharts()
        break
      case 'synthese':
        // ✅ Ne rien faire de spécial ici - charts_init.js s'en occupe
        break
      case 'schooling':
        this.initializeSchoolingCharts()
        break
      case 'childcare':
        this.initializeChildcareCharts()
        break
      case 'employment':
        this.initializeEmploymentCharts()
        break
      case 'domestic_violence':
        this.initializeSafetyCharts()
        break
    }

    // Événement global pour tous les composants
    const event = new CustomEvent('dashboard:sectionLoaded', {
      detail: { section: sectionName, container: document.getElementById(`${sectionName}-content`) }
    })
    document.dispatchEvent(event)
  }

  initializeFamiliesCharts() {
    const event = new CustomEvent('charts:initializeFamilies')
    document.dispatchEvent(event)
  }

  initializeEconomicCharts() {
    const event = new CustomEvent('charts:initializeEconomic')
    document.dispatchEvent(event)
  }

  initializeSchoolingCharts() {
    const event = new CustomEvent('charts:initializeSchooling')
    document.dispatchEvent(event)
  }

  initializeChildcareCharts() {
    const event = new CustomEvent('charts:initializeChildcare')
    document.dispatchEvent(event)
  }

  initializeEmploymentCharts() {
    const event = new CustomEvent('charts:initializeEmployment')
    document.dispatchEvent(event)
  }

  initializeSafetyCharts() {
    const event = new CustomEvent('charts:initializeSafety')
    document.dispatchEvent(event)
  }

  getSectionDisplayName(sectionName) {
    const names = {
      'synthese': 'de synthèse',
      'families': 'des familles',
      'economic_data': 'économiques',
      'schooling': 'de scolarité',
      'childcare': 'de garde d\'enfants',
      'employment': 'd\'emploi',
      'domestic_violence': 'de sécurité',
      'family_employment': 'd\'emploi familial',
      'children_comparison': 'de comparaison enfants'
    }
    return names[sectionName] || sectionName
  }

  // Méthode publique pour précharger les sections suivantes
  preloadNextSections() {
    const sectionsOrder = ['synthese', 'families', 'economic_data', 'schooling', 'childcare', 'employment', 'domestic_violence']

    sectionsOrder.forEach((section, index) => {
      if (!this.loadedSections.has(section)) {
        // Précharger avec un délai progressif (plus rapide)
        setTimeout(() => {
          this.loadSection(section)
        }, index * 500) // 500ms entre chaque préchargement
      }
    })
  }

  // Méthode pour vider le cache et recharger
  async clearCacheAndReload() {
    if (confirm('Vider le cache et recharger les données ?')) {
      try {
        await fetch('/dashboard/clear_cache')
        // Vider les sections chargées
        this.loadedSections.clear()
        // Recharger la section active
        const activeTab = document.querySelector('[data-dashboard-tabs-target="tab"].tab-active')
        if (activeTab) {
          const sectionName = activeTab.dataset.tab
          this.loadSection(sectionName)
        }
      } catch (error) {
        console.error('Erreur lors du vidage du cache:', error)
      }
    }
  }
}
