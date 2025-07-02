import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["sortableList", "item", "rankNumber", "hiddenInput"]

  connect() {
    this.sortable = window.Sortable.create(this.sortableListTarget, {
      animation: 300,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      forceFallback: false,
      fallbackClass: "sortable-fallback",
      scroll: true,
      scrollSensitivity: 100,
      scrollSpeed: 20,
      onStart: this.onDragStart.bind(this),
      onEnd: this.onDragEnd.bind(this)
    })

    // Initialiser l'ordre par défaut
    this.updateRanking()
  }

  disconnect() {
    if (this.sortable) {
      this.sortable.destroy()
    }
  }

  onDragStart(evt) {
    // Ajouter un feedback visuel quand le drag commence
    this.sortableListTarget.classList.add('border-blue-400', 'bg-blue-50')
  }

  onDragEnd(evt) {
    // Retirer le feedback visuel et mettre à jour
    this.sortableListTarget.classList.remove('border-blue-400', 'bg-blue-50')
    this.updateRanking()
  }

  updateRanking() {
    const orderedValues = []

    this.itemTargets.forEach((item, index) => {
      const rankNumber = item.querySelector('[data-ranking-question-target="rankNumber"]')
      rankNumber.textContent = index + 1

      // Animation du changement de numéro
      rankNumber.classList.add('animate-pulse')
      setTimeout(() => {
        rankNumber.classList.remove('animate-pulse')
      }, 600)

      const optionValue = item.dataset.optionValue
      orderedValues.push(optionValue)
    })

    // Mettre à jour le champ caché avec l'ordre
    this.hiddenInputTarget.value = JSON.stringify(orderedValues)
  }
}
