// app/javascript/controllers/comments_controller.js
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["container", "toggleButton", "comment"]

  connect() {
    this.truncateLongComments()
  }

  toggleShowAll(event) {
    const container = this.containerTarget
    const button = event.currentTarget
    const isExpanded = container.classList.contains('max-h-96')

    if (isExpanded) {
      container.classList.remove('max-h-96')
      container.classList.add('max-h-none')
      button.textContent = 'Réduire les commentaires'
    } else {
      container.classList.remove('max-h-none')
      container.classList.add('max-h-96')
      button.textContent = 'Voir tous les commentaires'
    }
  }

  toggleComment(event) {
    const button = event.currentTarget
    const commentDiv = button.closest('[data-comments-target="comment"]')
    const shortText = commentDiv.querySelector('.comment-short')
    const fullText = commentDiv.querySelector('.comment-full')

    if (fullText.classList.contains('hidden')) {
      shortText.classList.add('hidden')
      fullText.classList.remove('hidden')
      button.textContent = 'Lire moins'
    } else {
      shortText.classList.remove('hidden')
      fullText.classList.add('hidden')
      button.textContent = 'Lire plus'
    }
  }

  truncateLongComments() {
    this.commentTargets.forEach(commentDiv => {
      const textElement = commentDiv.querySelector('p')
      const originalText = textElement.textContent.trim()

      if (originalText.length > 200) {
        const truncatedText = originalText.substring(0, 200) + '...'

        textElement.innerHTML = `
          <span class="comment-short">${this.escapeHtml(truncatedText)}</span>
          <span class="comment-full hidden">${this.escapeHtml(originalText)}</span>
          <button data-action="click->comments#toggleComment"
                  class="text-blue-600 hover:text-blue-800 ml-2 text-xs font-medium">
            Lire plus
          </button>
        `
      }
    })
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
