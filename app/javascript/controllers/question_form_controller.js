import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "typeSelect",
    "optionsSection",
    "scaleSection",
    "preview",
    "optionsContainer",
    "title",
    "description",
    "required",
    "communeLocationInfo",
    "weeklyScheduleConfig"
  ]

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
    this.hideAllConfigs()

    // Show appropriate sections
    switch(type) {
      case 'single_choice':
      case 'multiple_choice':
      case 'ranking':  // ← Nouveau cas ajouté
        this.showOptionsConfig()
        break
      case 'scale':
        this.showScaleConfig()
        break
      case 'commune_location':
        this.showCommuneLocationConfig()
        break
      case 'weekly_schedule':
        this.showWeeklyScheduleConfig()
        break
    }
  }

  hideAllConfigs() {
    // Cacher toutes les sections de configuration
    this.optionsSectionTarget.classList.add('hidden')
    this.scaleSectionTarget.classList.add('hidden')

    if (this.hasCommuneLocationInfoTarget) {
      this.communeLocationInfoTarget.classList.add('hidden')
    }

    if (this.hasWeeklyScheduleConfigTarget) {
      this.weeklyScheduleConfigTarget.classList.add('hidden')
    }
  }

  showOptionsConfig() {
    this.optionsSectionTarget.classList.remove('hidden')
  }

  showScaleConfig() {
    this.scaleSectionTarget.classList.remove('hidden')
  }

  showCommuneLocationConfig() {
    if (this.hasCommuneLocationInfoTarget) {
      this.communeLocationInfoTarget.classList.remove('hidden')
    }
  }

  showWeeklyScheduleConfig() {
    if (this.hasWeeklyScheduleConfigTarget) {
      this.weeklyScheduleConfigTarget.classList.remove('hidden')
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

  // Méthode pour mettre à jour l'aperçu du planning hebdomadaire
  updateWeeklySchedulePreview() {
    if (!this.hasWeeklyScheduleConfigTarget) return

    const selectedDays = Array.from(this.weeklyScheduleConfigTarget.querySelectorAll('input[name="weekly_schedule_days[]"]:checked'))
      .map(input => input.value)

    const selectedTimeSlots = Array.from(this.weeklyScheduleConfigTarget.querySelectorAll('input[name="weekly_schedule_time_slots[]"]:checked'))
      .map(input => input.value)

    if (selectedDays.length === 0 || selectedTimeSlots.length === 0) {
      return '<p class="text-sm text-gray-500 italic">Sélectionnez au moins un jour et un créneau horaire</p>'
    }

    let tableHTML = '<div class="overflow-x-auto"><table class="min-w-full border border-gray-300 text-sm">'

    // En-tête
    tableHTML += '<thead><tr class="bg-gray-50">'
    tableHTML += '<th class="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700">Créneaux</th>'
    selectedDays.forEach(day => {
      tableHTML += `<th class="border border-gray-300 px-2 py-1 text-center font-medium text-gray-700">${day}</th>`
    })
    tableHTML += '</tr></thead>'

    // Corps du tableau
    tableHTML += '<tbody>'
    selectedTimeSlots.forEach((timeSlot, index) => {
      const bgClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      tableHTML += `<tr class="${bgClass}">`
      tableHTML += `<td class="border border-gray-300 px-2 py-1 font-medium text-gray-700">${timeSlot}</td>`
      selectedDays.forEach(day => {
        tableHTML += '<td class="border border-gray-300 px-2 py-1 text-center">'
        tableHTML += '<input type="checkbox" class="h-3 w-3 text-indigo-600 border-gray-300 rounded" disabled>'
        tableHTML += '</td>'
      })
      tableHTML += '</tr>'
    })
    tableHTML += '</tbody></table></div>'

    return tableHTML
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
      case 'ranking':  // ← Nouveau cas ajouté
        return this.generateRankingPreview()
      case 'scale':
        return this.generateScalePreview()
      case 'text':
        return '<input type="text" class="w-full rounded-md border-gray-300" placeholder="Réponse courte" disabled>'
      case 'long_text':
        return '<textarea rows="3" class="w-full rounded-md border-gray-300" placeholder="Réponse longue" disabled></textarea>'
      case 'email':
        return '<input type="email" class="w-full rounded-md border-gray-300" placeholder="email@exemple.com" disabled>'
      case 'phone':
        return '<input type="tel" class="w-full rounded-md border-gray-300" placeholder="01 23 45 67 89" disabled>'
      case 'date':
        return '<input type="date" class="w-full rounded-md border-gray-300" disabled>'
      case 'numeric':
        return '<input type="number" class="w-full rounded-md border-gray-300" placeholder="123" disabled>'
      case 'yes_no':
        return `
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="radio" name="preview_yes_no" value="yes" class="h-4 w-4 text-indigo-600 border-gray-300" disabled>
              <span class="ml-2 text-sm text-gray-700">Oui</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="preview_yes_no" value="no" class="h-4 w-4 text-indigo-600 border-gray-300" disabled>
              <span class="ml-2 text-sm text-gray-700">Non</span>
            </label>
          </div>
        `
      case 'commune_location':
        return '<p class="text-sm text-gray-500 italic">Question sur la commune d\'habitation (configuration automatique)</p>'
      case 'weekly_schedule':
        return this.updateWeeklySchedulePreview()
      default:
        return '<p class="text-gray-500 italic">Aperçu non disponible pour ce type de question</p>'
    }
  }

  generateRadioOptions() {
    const options = this.getOptionsFromForm()
    if (options.length === 0) {
      return '<p class="text-sm text-gray-500 italic">Ajoutez des options pour voir l\'aperçu</p>'
    }

    let html = '<div class="space-y-2">'
    options.forEach((option, index) => {
      html += `
        <label class="flex items-center">
          <input type="radio" name="preview_radio" value="${index}" class="h-4 w-4 text-indigo-600 border-gray-300" disabled>
          <span class="ml-2 text-sm text-gray-700">${option}</span>
        </label>
      `
    })
    html += '</div>'
    return html
  }

  generateCheckboxOptions() {
    const options = this.getOptionsFromForm()
    if (options.length === 0) {
      return '<p class="text-sm text-gray-500 italic">Ajoutez des options pour voir l\'aperçu</p>'
    }

    let html = '<div class="space-y-2">'
    options.forEach((option, index) => {
      html += `
        <label class="flex items-center">
          <input type="checkbox" value="${index}" class="h-4 w-4 text-indigo-600 border-gray-300 rounded" disabled>
          <span class="ml-2 text-sm text-gray-700">${option}</span>
        </label>
      `
    })
    html += '</div>'
    return html
  }

  // ← Nouvelle méthode pour la prévisualisation du ranking
  generateRankingPreview() {
    const options = this.getOptionsFromForm()
    if (options.length === 0) {
      return '<p class="text-sm text-gray-500 italic">Ajoutez des options pour voir l\'aperçu du classement</p>'
    }

    let html = `
      <div class="space-y-3">
        <div class="bg-blue-50 p-3 rounded-md">
          <p class="text-sm text-blue-700">
            <i class="fas fa-info-circle"></i>
            Glissez-déposez les éléments pour les classer par ordre de priorité
          </p>
        </div>

        <div class="space-y-2 border border-gray-200 rounded-lg p-3">
    `

    options.forEach((option, index) => {
      html += `
        <div class="bg-white border border-gray-300 rounded-lg p-3 cursor-move hover:bg-gray-50 transition-colors">
          <div class="flex items-center justify-between">
            <span class="font-medium">${option}</span>
            <div class="flex items-center space-x-2">
              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-bold">${index + 1}</span>
              <i class="fas fa-grip-vertical text-gray-400"></i>
            </div>
          </div>
        </div>
      `
    })

    html += `
        </div>
      </div>
    `
    return html
  }

  generateScalePreview() {
    if (!this.hasScaleSectionTarget) return ''

    const minInput = this.scaleSectionTarget.querySelector('input[name="scale_min"]')
    const maxInput = this.scaleSectionTarget.querySelector('input[name="scale_max"]')
    const stepInput = this.scaleSectionTarget.querySelector('input[name="scale_step"]')

    const min = parseInt(minInput?.value || '1')
    const max = parseInt(maxInput?.value || '5')
    const step = parseInt(stepInput?.value || '1')

    let html = '<div class="flex items-center space-x-4">'
    for (let i = min; i <= max; i += step) {
      html += `
        <label class="flex flex-col items-center">
          <input type="radio" name="preview_scale" value="${i}" class="h-4 w-4 text-indigo-600 border-gray-300" disabled>
          <span class="mt-1 text-sm text-gray-700">${i}</span>
        </label>
      `
    }
    html += '</div>'
    return html
  }

  getOptionsFromForm() {
    const options = []
    const optionInputs = this.optionsContainerTarget.querySelectorAll('input[name*="[text]"]')
    optionInputs.forEach(input => {
      if (input.value.trim()) {
        options.push(input.value.trim())
      }
    })
    return options
  }

  // Event listener pour mettre à jour l'aperçu du planning quand les checkboxes changent
  weeklyScheduleConfigChanged() {
    if (this.typeSelectTarget.value === 'weekly_schedule') {
      this.updatePreview()
    }
  }
}
