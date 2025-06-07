// app/javascript/controllers/questions_sortable_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    url: String,
    section: String
  }

  connect() {
    console.log('🎯 Questions sortable controller connected')
    console.log('Element:', this.element)
    console.log('Section ID:', this.sectionValue)
    console.log('URL:', this.urlValue)
    console.log('Question items found:', this.element.querySelectorAll('.question-item').length)
    console.log('Question handles found:', this.element.querySelectorAll('.question-drag-handle').length)

    this.initializeSortable()
  }

  async initializeSortable() {
    // Attendre que SortableJS soit disponible
    if (!window.Sortable) {
      await this.loadSortableJS()
    }

    this.sortable = new Sortable(this.element, {
      animation: 200,
      handle: '.question-drag-handle',
      draggable: '.question-item',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',

      // Groupe unique pour chaque section
      group: {
        name: `questions-section-${this.sectionValue}`,
        pull: false,
        put: false
      },

      onEnd: (event) => {
        if (event.oldIndex !== event.newIndex) {
          this.updateOrder()
        }
      }
    })
  }

  loadSortableJS() {
    return new Promise((resolve) => {
      if (window.Sortable) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/Sortable.min.js'
      script.onload = resolve
      document.head.appendChild(script)
    })
  }

  async updateOrder() {
    const questions = Array.from(this.element.querySelectorAll('.question-item'))
    const order = questions.map((question, index) => ({
      id: question.dataset.id,
      position: index + 1
    }))

    console.log('Mise à jour ordre questions:', order)

    try {
      const response = await fetch(this.urlValue, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ type: 'questions', order })
      })

      if (!response.ok) throw new Error('Erreur serveur')

      this.showToast('✅ Ordre des questions mis à jour!')
    } catch (error) {
      console.error('Erreur:', error)
      this.showToast('❌ Erreur lors de la mise à jour', 'error')
      setTimeout(() => window.location.reload(), 2000)
    }
  }

  showToast(message, type = 'success') {
    // Supprimer les toasts existants
    document.querySelectorAll('.toast-success, .toast-error').forEach(t => t.remove())

    const toast = document.createElement('div')
    toast.className = `toast-${type}`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  disconnect() {
    if (this.sortable) {
      this.sortable.destroy()
    }
  }
}
