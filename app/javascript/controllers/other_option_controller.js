// app/javascript/controllers/other_option_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["trigger", "input"]

  connect() {
    // Initialiser l'état des champs au chargement de la page
    this.triggerTargets.forEach(trigger => {
      this.updateOtherInput(trigger)
    })
  }

  toggleOtherInput(event) {
    this.updateOtherInput(event.target)
  }

  updateOtherInput(trigger) {
    const questionId = trigger.dataset.questionId
    const otherInput = this.inputTargets.find(input =>
      input.dataset.questionId === questionId
    )

    if (!otherInput) return

    const isChecked = trigger.checked
    const inputField = otherInput.querySelector('input[type="text"]')

    if (isChecked) {
      // Afficher le champ de saisie et lui donner le focus
      otherInput.style.display = 'block'
      if (inputField) {
        inputField.focus()
      }
    } else {
      // Masquer le champ et vider sa valeur
      otherInput.style.display = 'none'
      if (inputField) {
        inputField.value = ''
      }
    }
  }
}
