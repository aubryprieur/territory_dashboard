// app/javascript/controllers/sections_sortable_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { url: String }

  connect() {
    console.log('🎯 Sections sortable controller connected')
    console.log('Element:', this.element)
    console.log('URL:', this.urlValue)
    console.log('Section items found:', this.element.querySelectorAll('.section-item').length)
    console.log('Section handles found:', this.element.querySelectorAll('.section-drag-handle').length)

    this.initializeSortable()
  }

  async initializeSortable() {
    // Attendre que SortableJS soit disponible
    if (!window.Sortable) {
      await this.loadSortableJS()
    }

    this.sortable = new Sortable(this.element, {
      animation: 200,
      handle: '.section-drag-handle',
      draggable: '.section-item',
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',

      // Empêcher de trier dans les questions
      filter: '.questions-container',
      preventOnFilter: true,

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
    const sections = Array.from(this.element.querySelectorAll('.section-item'))
    const order = sections.map((section, index) => ({
      id: section.dataset.id,
      position: index + 1
    }))

    try {
      const response = await fetch(this.urlValue, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('[name="csrf-token"]').content,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ type: 'sections', order })
      })

      if (!response.ok) throw new Error('Erreur serveur')

      this.showToast('✅ Ordre des sections mis à jour!')
    } catch (error) {
      console.error('Erreur:', error)
      this.showToast('❌ Erreur lors de la mise à jour', 'error')
      setTimeout(() => window.location.reload(), 2000)
    }
  }

  showToast(message, type = 'success') {
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
