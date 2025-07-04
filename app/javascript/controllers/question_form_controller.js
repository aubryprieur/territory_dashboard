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
    "weeklyScheduleConfig",
    "otherOptionContainer",
    "otherOptionToggle",
    "otherTextLabelContainer"
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
        this.showOptionsConfig()
        this.showOtherOptionConfig()
        break
      case 'ranking':
        this.showOptionsConfig()
        this.hideOtherOptionConfig()
        break
      case 'scale':
        this.showScaleConfig()
        this.hideOtherOptionConfig()
        break
      case 'commune_location':
        this.showCommuneLocationConfig()
        this.hideOtherOptionConfig()
        break
      case 'weekly_schedule':
        this.showWeeklyScheduleConfig()
        this.hideOtherOptionConfig()
        break
      default:
        this.hideOtherOptionConfig()
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

  showOtherOptionConfig() {
    if (this.hasOtherOptionContainerTarget) {
      this.otherOptionContainerTarget.classList.remove('hidden')
    }
  }

  hideOtherOptionConfig() {
    if (this.hasOtherOptionContainerTarget) {
      this.otherOptionContainerTarget.classList.add('hidden')
      // Décocher l'option autre si on change vers un type qui ne la supporte pas
      if (this.hasOtherOptionToggleTarget) {
        this.otherOptionToggleTarget.checked = false
        this.toggleOtherOption()
      }
    }
  }

  toggleOtherOption() {
    if (!this.hasOtherOptionToggleTarget || !this.hasOtherTextLabelContainerTarget) return

    const isChecked = this.otherOptionToggleTarget.checked
    const container = this.otherTextLabelContainerTarget

    if (isChecked) {
      container.style.display = 'block'
    } else {
      container.style.display = 'none'
    }

    this.updatePreview()
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
    const type = this.typeSelectTarget.value
    const title = this.titleTarget.value || "Question sans titre"
    const description = this.descriptionTarget.value
    const required = this.requiredTarget.checked

    let previewHTML = `
      <div class="space-y-3">
        <label class="block">
          <span class="text-gray-700 font-medium">
            ${title}
            ${required ? '<span class="text-red-500">*</span>' : ''}
          </span>
          ${description ? `<p class="text-sm text-gray-500 mt-1">${description}</p>` : ''}
        </label>
    `

    switch(type) {
      case 'single_choice':
        previewHTML += this.renderSingleChoicePreview()
        break
      case 'multiple_choice':
        previewHTML += this.renderMultipleChoicePreview()
        break
      case 'scale':
        previewHTML += this.renderScalePreview()
        break
      case 'text':
        previewHTML += '<input type="text" class="mt-1 w-full rounded-md border-gray-300" placeholder="Réponse...">'
        break
      case 'long_text':
        previewHTML += '<textarea rows="3" class="mt-1 w-full rounded-md border-gray-300" placeholder="Votre réponse..."></textarea>'
        break
      case 'email':
        previewHTML += '<input type="email" class="mt-1 w-full rounded-md border-gray-300" placeholder="votre@email.com">'
        break
      case 'phone':
        previewHTML += '<input type="tel" class="mt-1 w-full rounded-md border-gray-300" placeholder="01 23 45 67 89">'
        break
      case 'date':
        previewHTML += '<input type="date" class="mt-1 w-full rounded-md border-gray-300">'
        break
      case 'numeric':
        previewHTML += '<input type="number" class="mt-1 w-full rounded-md border-gray-300" placeholder="0">'
        break
      case 'yes_no':
        previewHTML += `
          <div class="space-y-2">
            <label class="flex items-center">
              <input type="radio" name="preview_yes_no" value="yes" class="h-4 w-4 text-indigo-600 border-gray-300">
              <span class="ml-2">Oui</span>
            </label>
            <label class="flex items-center">
              <input type="radio" name="preview_yes_no" value="no" class="h-4 w-4 text-indigo-600 border-gray-300">
              <span class="ml-2">Non</span>
            </label>
          </div>
        `
        break
      case 'ranking':
        previewHTML += this.renderRankingPreview()
        break
      case 'commune_location':
        previewHTML += `
          <select class="mt-1 w-full rounded-md border-gray-300">
            <option>Sélectionnez votre commune...</option>
            <option>Exemple Commune 1</option>
            <option>Exemple Commune 2</option>
            <option>Autre commune</option>
          </select>
        `
        break
      case 'weekly_schedule':
        previewHTML += this.renderWeeklySchedulePreview()
        break
      default:
        previewHTML += '<p class="text-gray-500 italic">Sélectionnez un type de question</p>'
    }

    previewHTML += '</div>'
    this.previewTarget.innerHTML = previewHTML
  }

  renderSingleChoicePreview() {
    const options = this.getOptionsFromForm()
    const hasOther = this.hasOtherOptionToggleTarget && this.otherOptionToggleTarget.checked
    const otherLabel = this.getOtherTextLabel()

    if (options.length === 0 && !hasOther) {
      return '<p class="text-sm text-gray-500 italic">Ajoutez des options de réponse</p>'
    }

    let html = '<div class="space-y-2">'

    options.forEach(option => {
      html += `
        <label class="flex items-center">
          <input type="radio" name="preview_single" class="h-4 w-4 text-indigo-600 border-gray-300">
          <span class="ml-2">${option}</span>
        </label>
      `
    })

    if (hasOther) {
      html += `
        <label class="flex items-center">
          <input type="radio" name="preview_single" class="h-4 w-4 text-indigo-600 border-gray-300">
          <span class="ml-2">${otherLabel}</span>
        </label>
        <div class="ml-6 mt-2">
          <input type="text" placeholder="Veuillez préciser..." class="w-full rounded-md border-gray-300 text-sm">
        </div>
      `
    }

    html += '</div>'
    return html
  }

  renderMultipleChoicePreview() {
    const options = this.getOptionsFromForm()
    const hasOther = this.hasOtherOptionToggleTarget && this.otherOptionToggleTarget.checked
    const otherLabel = this.getOtherTextLabel()

    if (options.length === 0 && !hasOther) {
      return '<p class="text-sm text-gray-500 italic">Ajoutez des options de réponse</p>'
    }

    let html = '<div class="space-y-2">'

    options.forEach(option => {
      html += `
        <label class="flex items-center">
          <input type="checkbox" class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
          <span class="ml-2">${option}</span>
        </label>
      `
    })

    if (hasOther) {
      html += `
        <label class="flex items-center">
          <input type="checkbox" class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
          <span class="ml-2">${otherLabel}</span>
        </label>
        <div class="ml-6 mt-2">
          <input type="text" placeholder="Veuillez préciser..." class="w-full rounded-md border-gray-300 text-sm">
        </div>
      `
    }

    html += '</div>'
    return html
  }

  renderRankingPreview() {
    const options = this.getOptionsFromForm()

    if (options.length === 0) {
      return '<p class="text-sm text-gray-500 italic">Ajoutez des options à classer</p>'
    }

    let html = '<div class="space-y-2">'
    html += '<p class="text-sm text-blue-700 bg-blue-50 p-2 rounded">Glissez-déposez pour classer par ordre de priorité</p>'

    options.forEach((option, index) => {
      html += `
        <div class="flex items-center p-2 bg-gray-50 rounded border">
          <svg class="h-4 w-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a1 1 0 011 1v2h4V3a1 1 0 112 0v2h2a2 2 0 012 2v2H3V7a2 2 0 012-2h2V3a1 1 0 011-1z"></path>
          </svg>
          <span>${index + 1}. ${option}</span>
        </div>
      `
    })

    html += '</div>'
    return html
  }

  renderScalePreview() {
    // Récupérer les valeurs depuis les inputs de configuration
    const scaleMin = document.querySelector('input[name="scale_min"]')?.value || 1
    const scaleMax = document.querySelector('input[name="scale_max"]')?.value || 5
    const scaleMinLabel = document.querySelector('input[name="scale_min_label"]')?.value
    const scaleMaxLabel = document.querySelector('input[name="scale_max_label"]')?.value

    let html = '<div class="space-y-3">'

    if (scaleMinLabel || scaleMaxLabel) {
      html += '<div class="flex justify-between text-sm text-gray-600">'
      html += `<span>${scaleMinLabel || ''}</span>`
      html += `<span>${scaleMaxLabel || ''}</span>`
      html += '</div>'
    }

    html += '<div class="flex space-x-2">'
    for (let i = parseInt(scaleMin); i <= parseInt(scaleMax); i++) {
      html += `
        <label class="flex flex-col items-center">
          <input type="radio" name="preview_scale" value="${i}" class="h-4 w-4 text-indigo-600 border-gray-300">
          <span class="mt-1 text-sm">${i}</span>
        </label>
      `
    }
    html += '</div></div>'

    return html
  }

  renderWeeklySchedulePreview() {
    if (!this.hasWeeklyScheduleConfigTarget) {
      return '<p class="text-sm text-gray-500 italic">Configuration du planning non disponible</p>'
    }

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
      tableHTML += `<td class="border border-gray-300 px-2 py-1 font-medium">${timeSlot}</td>`

      selectedDays.forEach(day => {
        tableHTML += `
          <td class="border border-gray-300 px-2 py-1 text-center">
            <input type="checkbox" class="h-4 w-4 text-indigo-600 border-gray-300 rounded">
          </td>
        `
      })
      tableHTML += '</tr>'
    })
    tableHTML += '</tbody></table></div>'

    return tableHTML
  }

  getOptionsFromForm() {
    const options = []
    this.optionsContainerTarget.querySelectorAll('.option-field input[type="text"]').forEach(input => {
      if (input.value.trim()) {
        options.push(input.value.trim())
      }
    })
    return options
  }

  getOtherTextLabel() {
    if (this.hasOtherTextLabelContainerTarget) {
      const input = this.otherTextLabelContainerTarget.querySelector('input[name="other_text_label"]')
      return input ? input.value || 'Autre (précisez)' : 'Autre (précisez)'
    }
    return 'Autre (précisez)'
  }
}
