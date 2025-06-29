import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["yesRadio", "noRadio", "otherField", "communeSelect"]

  connect() {
    // Initialiser l'état au chargement
    this.toggleOtherField()
  }

  toggleOtherField() {
    if (!this.hasOtherFieldTarget) return

    const otherInput = this.otherFieldTarget.querySelector('input')

    // Pour commune : afficher si "Non" est sélectionné
    if (this.hasNoRadioTarget && this.noRadioTarget.checked) {
      this.showOtherField(otherInput)
    }
    // Pour EPCI : afficher si "Autre" est sélectionné
    else if (this.hasCommuneSelectTarget && this.communeSelectTarget.value === 'other') {
      this.showOtherField(otherInput)
    } else {
      this.hideOtherField(otherInput)
    }
  }

  showOtherField(input) {
    this.otherFieldTarget.classList.remove('hidden')
    input.required = true
  }

  hideOtherField(input) {
    this.otherFieldTarget.classList.add('hidden')
    input.required = false
    input.value = ''
  }
}
