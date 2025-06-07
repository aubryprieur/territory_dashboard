// app/javascript/controllers/sortable_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    url: String,
    type: String
  }

  connect() {
    console.log(`🎯 Contrôleur sortable connecté pour: ${this.typeValue}`)
    console.log('📍 Élément:', this.element)
    console.log('🔗 URL:', this.urlValue)

    // Attendre que la page soit complètement chargée
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeSortable())
    } else {
      // Délai pour s'assurer que tous les styles sont chargés
      setTimeout(() => this.initializeSortable(), 100)
    }
  }

  initializeSortable() {
    console.log(`🚀 Initialisation de Sortable pour ${this.typeValue}...`)

    // Vérifier si SortableJS est disponible
    if (!window.Sortable) {
      console.error('❌ SortableJS non trouvé!')
      return this.loadSortableJS().then(() => this.createSortable())
    }

    this.createSortable()
  }

  loadSortableJS() {
    return new Promise((resolve, reject) => {
      console.log('📦 Chargement de SortableJS depuis CDN...')
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js'
      script.onload = () => {
        console.log('✅ SortableJS chargé')
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  createSortable() {
    if (this.sortable) {
      console.log('🔄 Destruction de l\'ancien Sortable')
      this.sortable.destroy()
    }

    // Configuration selon le type
    const config = {
      animation: 200,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      handle: this.typeValue === 'sections' ? '.section-drag-handle' : '.question-drag-handle',
      forceFallback: false,
      fallbackClass: 'sortable-fallback',
      disabled: false,

      onStart: (event) => {
        console.log(`🚀 Début du drag pour ${this.typeValue}`)
        console.log('Élément:', event.item.dataset.id)
        event.item.classList.add('is-dragging')

        // Ajouter un indicateur visuel
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
      },

      onEnd: (event) => {
        console.log(`🏁 Fin du drag pour ${this.typeValue}`)
        event.item.classList.remove('is-dragging')
        this.element.style.backgroundColor = ''

        this.handleReorder(event)
      },

      onMove: (event) => {
        // Empêcher de déplacer les éléments en dehors de leur conteneur
        return true
      }
    }

    // Configuration spéciale pour éviter les conflits entre sections et questions
    if (this.typeValue === 'sections') {
      config.group = {
        name: 'sections',
        pull: false,
        put: false
      }
    } else if (this.typeValue === 'questions') {
      config.group = {
        name: 'questions',
        pull: false,
        put: false
      }
    }

    try {
      this.sortable = new window.Sortable(this.element, config)
      console.log(`✅ Sortable créé avec succès pour ${this.typeValue}`)
      console.log('Handles trouvés:', this.element.querySelectorAll(config.handle).length)

      // Test rapide de fonctionnalité
      if (this.element.children.length > 0) {
        console.log('👶 Premiers enfants:', Array.from(this.element.children).slice(0, 2).map(el => el.dataset.id))
      }

    } catch (error) {
      console.error(`❌ Erreur création Sortable pour ${this.typeValue}:`, error)
    }
  }

  handleReorder(event) {
    console.log(`🔄 Traitement du réordonnement pour ${this.typeValue}`)
    console.log('Détails event:', {
      oldIndex: event.oldIndex,
      newIndex: event.newIndex,
      item: event.item.dataset.id
    })

    // Ne rien faire si l'élément n'a pas bougé
    if (event.oldIndex === event.newIndex) {
      console.log('ℹ️ Aucun changement de position')
      return
    }

    // Calculer le nouvel ordre
    const items = Array.from(this.element.children)
    const newOrder = items.map((item, index) => {
      const id = item.dataset.id
      if (!id) {
        console.warn('⚠️ Élément sans data-id:', item)
        return null
      }
      return {
        id: id,
        position: index + 1
      }
    }).filter(Boolean)

    console.log('📝 Nouvel ordre calculé:', newOrder)

    if (newOrder.length === 0) {
      console.error('❌ Aucun élément avec data-id trouvé!')
      return
    }

    // Envoyer au serveur
    this.updateOrder(newOrder)
  }

  async updateOrder(newOrder) {
    console.log('📡 Envoi au serveur...', {
      url: this.urlValue,
      type: this.typeValue,
      order: newOrder
    })

    try {
      // Préparer la requête
      const csrfToken = document.querySelector('[name="csrf-token"]')?.content
      if (!csrfToken) {
        throw new Error('Token CSRF manquant')
      }

      const payload = {
        type: this.typeValue,
        order: newOrder
      }

      console.log('📦 Payload:', JSON.stringify(payload, null, 2))

      const response = await fetch(this.urlValue, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log(`📨 Réponse serveur: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erreur serveur:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ Succès:', result)
      this.showSuccess()

    } catch (error) {
      console.error('❌ Erreur complète:', error)
      this.showError(error.message)

      // Recharger la page en cas d'erreur pour restaurer l'ordre correct
      setTimeout(() => {
        console.log('🔄 Rechargement de la page pour restaurer l\'ordre...')
        window.location.reload()
      }, 2000)
    }
  }

  showSuccess() {
    this.removeExistingToasts()

    const toast = document.createElement('div')
    toast.className = 'toast-success'
    toast.textContent = `✅ Ordre des ${this.typeValue === 'sections' ? 'sections' : 'questions'} mis à jour!`
    document.body.appendChild(toast)

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove()
      }
    }, 3000)
  }

  showError(message = 'Erreur lors de la mise à jour') {
    this.removeExistingToasts()

    const toast = document.createElement('div')
    toast.className = 'toast-error'
    toast.textContent = `❌ ${message}`
    document.body.appendChild(toast)

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove()
      }
    }, 5000)
  }

  removeExistingToasts() {
    document.querySelectorAll('.toast-success, .toast-error').forEach(toast => {
      if (toast.parentNode) {
        toast.remove()
      }
    })
  }

  disconnect() {
    console.log(`🔌 Déconnexion du contrôleur sortable pour ${this.typeValue}`)
    if (this.sortable) {
      this.sortable.destroy()
      this.sortable = null
    }
  }
}
