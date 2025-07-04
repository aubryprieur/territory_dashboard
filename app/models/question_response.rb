class QuestionResponse < ApplicationRecord
  belongs_to :survey_response
  belongs_to :question

  validates :survey_response, presence: true
  validates :question, presence: true

  def answer
    case question.question_type
    when 'single_choice', 'yes_no'
      answer_text
    when 'multiple_choice', 'weekly_schedule'
      answer_data.is_a?(Array) ? answer_data : []
    when 'ranking'
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
    when 'single_choice'
      if value.is_a?(Hash) && value['type'] == 'other'
        self.answer_data = value
        self.answer_text = 'other'
      else
        self.answer_text = value.to_s
        self.answer_data = nil
      end
    when 'multiple_choice'
      processed_values = []

      if value.is_a?(Array)
        value.each do |v|
          if v.is_a?(Hash) && v['type'] == 'other'
            processed_values << v
          else
            processed_values << v
          end
        end
      end

      self.answer_data = processed_values
      self.answer_text = processed_values.map { |v| v.is_a?(Hash) ? 'other' : v }.join(', ')
    when 'ranking'
      self.answer_data = value.is_a?(Array) ? value : [value].compact
      self.answer_text = answer_data.join(', ')
    else
      self.answer_text = value.to_s
    end
  end

  # Méthode pour formatter l'affichage de la réponse (utilisée dans l'export CSV)
  def formatted_answer
    case question.question_type
    when 'weekly_schedule'
      if answer_data.is_a?(Array) && answer_data.any?
        # Transformer les réponses en format lisible
        answer_data.map do |value|
          day, time_slot = value.split('_', 2)
          time_slot_readable = time_slot.humanize.gsub(/_/, ' ')
          "#{day}: #{time_slot_readable}"
        end.join(', ')
      else
        'Aucun créneau sélectionné'
      end
    when 'single_choice', 'yes_no'
      if question.question_type == 'yes_no'
        answer_text == 'yes' ? 'Oui' : 'Non'
      else
        # Vérifier si c'est une réponse "autre"
        if answer_data.is_a?(Hash) && answer_data['type'] == 'other'
          "Autre : #{answer_data['text']}"
        else
          # Trouver l'option correspondante pour afficher le texte
          option = question.question_options.find { |opt| opt.value == answer_text }
          option&.text || answer_text
        end
      end
    when 'ranking'
      if answer_data.is_a?(Array) && answer_data.any?
        answer_data.map.with_index(1) do |option_value, rank|
          option = question.question_options.find { |opt| opt.value == option_value }
          option_text = option&.text || option_value
          "#{rank}. #{option_text}"
        end.join(', ')
      else
        'Aucun classement'
      end
    when 'multiple_choice'
      if answer_data.is_a?(Array)
        answer_data.map do |value|
          if value.is_a?(Hash) && value['type'] == 'other'
            "Autre : #{value['text']}"
          else
            option = question.question_options.find { |opt| opt.value == value }
            option&.text || value
          end
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

  # Méthode pour récupérer le texte de l'option "autre" (pour l'export CSV)
  def other_text
    case question.question_type
    when 'single_choice'
      if answer_data.is_a?(Hash) && answer_data['type'] == 'other'
        answer_data['text']
      else
        nil
      end
    when 'multiple_choice'
      if answer_data.is_a?(Array)
        other_responses = answer_data.select { |v| v.is_a?(Hash) && v['type'] == 'other' }
        other_responses.map { |r| r['text'] }.join(', ') if other_responses.any?
      else
        nil
      end
    else
      nil
    end
  end

  # Méthode pour vérifier si la réponse contient une option "autre"
  def has_other_response?
    case question.question_type
    when 'single_choice'
      answer_data.is_a?(Hash) && answer_data['type'] == 'other'
    when 'multiple_choice'
      answer_data.is_a?(Array) && answer_data.any? { |v| v.is_a?(Hash) && v['type'] == 'other' }
    else
      false
    end
  end

  # Méthode pour récupérer les réponses normales (sans les "autre")
  def normal_answers
    case question.question_type
    when 'single_choice'
      if answer_data.is_a?(Hash) && answer_data['type'] == 'other'
        []
      else
        [answer_text]
      end
    when 'multiple_choice'
      if answer_data.is_a?(Array)
        normal_responses = answer_data.select { |v| !v.is_a?(Hash) || v['type'] != 'other' }
        normal_responses.map do |value|
          option = question.question_options.find { |opt| opt.value == value }
          option&.text || value
        end
      else
        []
      end
    else
      [formatted_answer]
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
