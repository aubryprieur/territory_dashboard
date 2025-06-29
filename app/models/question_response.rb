class QuestionResponse < ApplicationRecord
  belongs_to :survey_response
  belongs_to :question

  validates :survey_response, presence: true
  validates :question, presence: true

  def answer
    case question.question_type
    when 'single_choice', 'yes_no'
      answer_text
    when 'multiple_choice'
      answer_data.is_a?(Array) ? answer_data : []
    when 'commune_location'
      # Pour les questions commune_location, retourner l'answer_text
      answer_text
    when 'scale', 'numeric'
      answer_text.to_i if answer_text.present?
    else
      answer_text
    end
  end

  def answer=(value)
    case question.question_type
    when 'multiple_choice'
      self.answer_data = value.is_a?(Array) ? value : [value].compact
      self.answer_text = answer_data.join(', ')
    else
      self.answer_text = value.to_s
    end
  end

  # Méthode pour formatter l'affichage de la réponse (utilisée dans l'export CSV)
  def formatted_answer
    case question.question_type
    when 'single_choice', 'yes_no'
      if question.question_type == 'yes_no'
        answer_text == 'yes' ? 'Oui' : 'Non'
      else
        # Trouver l'option correspondante pour afficher le texte
        option = question.question_options.find { |opt| opt.value == answer_text }
        option&.text || answer_text
      end
    when 'multiple_choice'
      if answer_data.is_a?(Array)
        answer_data.map do |value|
          option = question.question_options.find { |opt| opt.value == value }
          option&.text || value
        end.join(', ')
      else
        ''
      end
    when 'commune_location'
      # Pour commune_location, afficher "Autre commune" pour les réponses "other"
      if answer_data.present? && answer_data.is_a?(Hash)
        if answer_data['type'] == 'other'
          'Autre commune'  # Affichage uniforme pour toutes les autres communes
        else
          answer_data['commune_name'] || answer_text
        end
      else
        # Fallback pour les anciennes données
        if answer_text == 'other'
          'Autre commune'
        else
          answer_text
        end
      end
    when 'scale', 'numeric'
      answer_text
    else
      answer_text
    end
  end

  private

  def process_commune_location_answer(value)
    if value == 'other'
      # La valeur "other" sera traitée dans le contrôleur
      self.answer_data = {
        'type' => 'other',
        'commune_code' => value
      }
    else
      # C'est un code INSEE de commune
      commune_name = fetch_commune_name(value)
      self.answer_data = {
        'type' => 'commune',
        'commune_code' => value,
        'commune_name' => commune_name
      }
    end
  end

  def fetch_commune_name(code)
    # Chercher d'abord dans les options de la question
    if question.options && question.options['commune_list']
      commune = question.options['commune_list'].find { |c| c['code'] == code }
      return commune['name'] if commune
    end

    # Sinon, chercher dans la base de données
    territory = Territory.find_by(codgeo: code)
    territory&.libgeo || code
  end
end
