import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tab", "content"]

  connect() {
    // Activer le premier onglet par défaut
    this.showTab('active')
  }

  switchTab(event) {
    event.preventDefault()
    const tabName = event.currentTarget.dataset.tab
    this.showTab(tabName)
  }

  showTab(tabName) {
    // Masquer tous les contenus
    this.contentTargets.forEach(content => {
      content.classList.add('hidden')
    })

    // Désactiver tous les onglets
    this.tabTargets.forEach(tab => {
      tab.classList.remove('border-indigo-500', 'text-indigo-600')
      tab.classList.add('border-transparent', 'text-gray-500')
    })

    // Afficher le contenu sélectionné
    const selectedContent = document.getElementById(`${tabName}-content`)
    if (selectedContent) {
      selectedContent.classList.remove('hidden')
    }

    // Activer l'onglet sélectionné
    const selectedTab = this.tabTargets.find(tab => tab.dataset.tab === tabName)
    if (selectedTab) {
      selectedTab.classList.remove('border-transparent', 'text-gray-500')
      selectedTab.classList.add('border-indigo-500', 'text-indigo-600')
    }
  }
}
