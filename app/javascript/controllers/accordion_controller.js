// app/javascript/controllers/accordion_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["header", "content", "arrow"]

  toggle(event) {
    // Trouver l'index de l'accordéon cliqué
    const clickedHeader = event.currentTarget
    const index = clickedHeader.dataset.accordionIndex

    // Trouver les éléments correspondants
    const content = this.contentTargets.find(el =>
      el.dataset.accordionIndex === index
    )
    const arrow = this.arrowTargets.find(el =>
      el.dataset.accordionIndex === index
    )

    if (content && arrow) {
      // Toggle le contenu avec animation
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden')
        // Animation d'ouverture
        content.style.maxHeight = '0px'
        content.style.overflow = 'hidden'
        content.style.transition = 'max-height 0.3s ease-out'

        // Calculer la hauteur réelle
        const height = content.scrollHeight
        requestAnimationFrame(() => {
          content.style.maxHeight = height + 'px'
        })

        // Nettoyer après l'animation
        setTimeout(() => {
          content.style.maxHeight = 'none'
          content.style.overflow = 'visible'
        }, 300)

        // Rotation de la flèche
        arrow.style.transform = 'rotate(180deg)'
      } else {
        // Animation de fermeture
        content.style.maxHeight = content.scrollHeight + 'px'
        content.style.overflow = 'hidden'
        content.style.transition = 'max-height 0.3s ease-out'

        requestAnimationFrame(() => {
          content.style.maxHeight = '0px'
        })

        setTimeout(() => {
          content.classList.add('hidden')
          content.style.maxHeight = 'none'
          content.style.overflow = 'visible'
        }, 300)

        // Rotation de la flèche
        arrow.style.transform = 'rotate(0deg)'
      }
    }
  }

  connect() {
    // Initialiser les flèches
    this.arrowTargets.forEach(arrow => {
      arrow.style.transition = 'transform 0.3s ease'
    })
  }
}
