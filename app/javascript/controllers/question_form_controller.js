import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["typeSelect", "optionsSection", "scaleSection", "preview", "optionsContainer", "title", "description", "required"]

  connect() {
    this.optionCounter = this.optionsContainerTarget.querySelectorAll('.option-field').length
    this.updateFormBasedOnType()
    this.updatePreview()
  }

  disconnect() {
    // Cleanup when controller is disconnected
  }

  typeChanged() {
    this.updateFormBasedOnType()
    this.updatePreview()
  }

  updateFormBasedOnType() {
    const type = this.typeSelectTarget.value

    // Hide all specific sections
    this.optionsSectionTarget.classList.add('hidden')
    this.scaleSectionTarget.classList.add('hidden')

    // Show appropriate sections
    switch(type) {
      case 'single_choice':
      case 'multiple_choice':
        this.optionsSectionTarget.classList.remove('hidden')
        break
      case 'scale':
        this.scaleSectionTarget.classList.remove('hidden')
        break
    }
  }

  addOption() {
    this.optionCounter++
    const timestamp = new Date().getTime()
    const optionDiv = document.createElement('div')
    optionDiv.className = 'flex items-center space-x-2 option-field mb-2'
    optionDiv.innerHTML = `
      <input type="text"
             name="question[question_options_attributes][${timestamp}][text]"
             placeholder="Texte de l'option"
             class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
             data-action="input->question-form#updatePreview"
             required>
      <input type="hidden"
             name="question[question_options_attributes][${timestamp}][position]"
             value="${this.optionCounter}">
      <button type="button"
              data-action="click->question-form#removeOption"
              class="text-red-600 hover:text-red-500">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    `

    this.optionsContainerTarget.appendChild(optionDiv)
  }

  removeOption(event) {
    event.currentTarget.closest('.option-field').remove()
    this.updatePreview()
  }

  updatePreview() {
    const questionTitle = this.titleTarget.value
    const questionType = this.typeSelectTarget.value
    const questionDescription = this.descriptionTarget.value
    const isRequired = this.requiredTarget.checked

    let previewHTML = ''

    if (questionTitle) {
      previewHTML += `<div class="mb-3">`
      previewHTML += `<label class="block text-sm font-medium text-gray-700 mb-2">`
      previewHTML += questionTitle
      if (isRequired) previewHTML += '<span class="text-red-500 ml-1">*</span>'
      previewHTML += `</label>`

      if (questionDescription) {
        previewHTML += `<p class="text-xs text-gray-500 mb-2">${questionDescription}</p>`
      }

      previewHTML += this.generatePreviewForType(questionType)
      previewHTML += `</div>`
    } else {
      previewHTML = '<p class="text-gray-500 italic">Entrez un titre de question pour voir la prévisualisation</p>'
    }

    this.previewTarget.innerHTML = previewHTML
  }

  generatePreviewForType(type) {
    switch(type) {
      case 'single_choice':
        return this.generateRadioOptions()
      case 'multiple_choice':
        return this.generateCheckboxOptions()
      case 'scale':
        return this.generateScale()
      case 'text':
        return `<input type="text" class="w-full rounded-md border-gray-300 shadow-sm" placeholder="Réponse courte" disabled>`
      case 'long_text':
        return `<textarea rows="3" class="w-full rounded-md border-gray-300 shadow-sm" placeholder="Réponse longue" disabled></textarea>`
      case 'email':
        return `<input type="email" class="w-full rounded-md border-gray-300 shadow-sm" placeholder="exemple@email.com" disabled>`
      case 'phone':
        return `<input type="tel" class="w-full rounded-md border-gray-300 shadow-sm" placeholder="06 12 34 56 78" disabled>`
      case 'date':
        return `<input type="date" class="w-full rounded-md border-gray-300 shadow-sm" disabled>`
      case 'numeric':
        return `<input type="number" class="w-full rounded-md border-gray-300 shadow-sm" placeholder="Entrez un nombre" disabled>`
      case 'yes_no':
        return `
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input type="radio" name="preview_yesno" value="yes" class="mr-2" disabled>
              <span class="text-sm">Oui</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="preview_yesno" value="no" class="mr-2" disabled>
              <span class="text-sm">Non</span>
            </label>
          </div>
        `
      default:
        return ''
    }
  }

  generateRadioOptions() {
    const options = Array.from(this.optionsContainerTarget.querySelectorAll('.option-field input[type="text"]'))
                        .map(input => input.value)
                        .filter(value => value.trim() !== '')

    let html = ''
    options.forEach((option, index) => {
      html += `
        <div class="flex items-center mb-2">
          <input type="radio" name="preview_radio" id="preview_radio_${index}" class="mr-2" disabled>
          <label for="preview_radio_${index}" class="text-sm">${option}</label>
        </div>
      `
    })
    return html
  }

  generateCheckboxOptions() {
    const options = Array.from(this.optionsContainerTarget.querySelectorAll('.option-field input[type="text"]'))
                        .map(input => input.value)
                        .filter(value => value.trim() !== '')

    let html = ''
    options.forEach((option, index) => {
      html += `
        <div class="flex items-center mb-2">
          <input type="checkbox" id="preview_check_${index}" class="mr-2" disabled>
          <label for="preview_check_${index}" class="text-sm">${option}</label>
        </div>
      `
    })
    return html
  }

  generateScale() {
    const min = document.getElementById('scale_min')?.value || 1
    const max = document.getElementById('scale_max')?.value || 5
    const minLabel = document.getElementById('scale_min_label')?.value || ''
    const maxLabel = document.getElementById('scale_max_label')?.value || ''

    let html = `<div class="flex items-center justify-between mb-2">`
    if (minLabel) html += `<span class="text-xs text-gray-500">${minLabel}</span>`
    html += `<div class="flex space-x-2">`

    for (let i = parseInt(min); i <= parseInt(max); i++) {
      html += `
        <label class="flex flex-col items-center">
          <input type="radio" name="preview_scale" value="${i}" class="mb-1" disabled>
          <span class="text-xs">${i}</span>
        </label>
      `
    }

    html += `</div>`
    if (maxLabel) html += `<span class="text-xs text-gray-500">${maxLabel}</span>`
    html += `</div>`

    return html
  }
}
