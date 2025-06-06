// app/javascript/controllers/sortable_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    url: String,
    type: String
  }

  connect() {
    console.log(`Contrôleur sortable connecté pour: ${this.typeValue}`)

    // Attendre que SortableJS soit disponible
    if (window.Sortable) {
      this.initializeSortable()
    } else {
      // Attendre un peu que le script se charge
      setTimeout(() => {
        if (window.Sortable) {
          this.initializeSortable()
        } else {
          console.error('SortableJS non trouvé')
        }
      }, 500)
    }
  }

  initializeSortable() {
    console.log('Initialisation de Sortable...')

    this.sortable = new window.Sortable(this.element, {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      handle: '.drag-handle',
      onStart: (event) => {
        console.log('Début du drag')
      },
      onEnd: (event) => {
        console.log('Fin du drag')
        this.onEnd(event)
      }
    })

    console.log('Sortable initialisé avec succès')
  }

  disconnect() {
    if (this.sortable) {
      this.sortable.destroy()
      console.log('Sortable détruit')
    }
  }

  onEnd(event) {
    console.log('Traitement du réordonnement...')

    // Récupérer les nouveaux positions
    const items = Array.from(this.element.children)
    const newOrder = items.map((item, index) => ({
      id: item.dataset.id,
      position: index + 1
    }))

    console.log('Nouvel ordre:', newOrder)

    // Envoyer au serveur
    this.updateOrder(newOrder)
  }

  async updateOrder(newOrder) {
    try {
      console.log('Envoi au serveur...', {
        url: this.urlValue,
        type: this.typeValue,
        order: newOrder
      })

      const response = await fetch(this.urlValue, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content
        },
        body: JSON.stringify({
          type: this.typeValue,
          order: newOrder
        })
      })

      console.log('Réponse serveur:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('Succès:', result)
      this.showSuccess()
    } catch (error) {
      console.error('Erreur complète:', error)
      this.showError(error.message)
    }
  }

  showSuccess() {
    const toast = document.createElement('div')
    toast.className = 'toast-success'
    toast.textContent = 'Ordre mis à jour avec succès'
    document.body.appendChild(toast)

    setTimeout(() => toast.remove(), 3000)
  }

  showError(message = 'Erreur lors de la mise à jour') {
    const toast = document.createElement('div')
    toast.className = 'toast-error'
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => toast.remove(), 5000)
  }
}
