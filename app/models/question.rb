# app/models/question.rb
class Question < ApplicationRecord
  belongs_to :survey_section
  has_many :question_options, -> { order(:position) }, dependent: :destroy
  has_many :question_responses, dependent: :destroy

  validates :title, presence: true
  validates :question_type, presence: true
  validates :position, presence: true, uniqueness: { scope: :survey_section_id }

  QUESTION_TYPES = %w[
    single_choice
    multiple_choice
    scale
    numeric
    text
    long_text
    email
    phone
    date
    yes_no
    commune_location
    weekly_schedule
  ].freeze

  validates :question_type, inclusion: { in: QUESTION_TYPES }

  before_validation :set_position, on: :create
  accepts_nested_attributes_for :question_options, allow_destroy: true

  def commune_location_question?
    question_type == 'commune_location'
  end

  def requires_options?
    %w[single_choice multiple_choice scale commune_location].include?(question_type)
  end

  def is_choice_question?
    %w[single_choice multiple_choice].include?(question_type)
  end

  def is_scale_question?
    question_type == 'scale'
  end

  def is_text_question?
    %w[text long_text email phone].include?(question_type)
  end

  def multiple_choice?
    question_type == 'multiple_choice'
  end

  def single_choice?
    question_type == 'single_choice'
  end

  def validation_errors_for(answer)
    errors = []

    # Vérifier si requis
    if required? && answer.blank?
      errors << "Cette question est obligatoire"
    end

    return errors if answer.blank?

    # Validation selon le type
    case question_type
    when 'email'
      unless answer.match?(/\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i)
        errors << "Format d'email invalide"
      end
    when 'phone'
      unless answer.match?(/\A[\d\s\-\+\(\)\.]+\z/)
        errors << "Format de téléphone invalide"
      end
    when 'numeric'
      unless answer.match?(/\A\d+(\.\d+)?\z/)
        errors << "Doit être un nombre"
      end
    end

    # Validation personnalisée depuis validation_rules
    if validation_rules.present?
      if validation_rules['min_length'] && answer.length < validation_rules['min_length']
        errors << "Minimum #{validation_rules['min_length']} caractères"
      end
      if validation_rules['max_length'] && answer.length > validation_rules['max_length']
        errors << "Maximum #{validation_rules['max_length']} caractères"
      end
    end

    errors
  end

  def weekly_schedule_question?
    question_type == 'weekly_schedule'
  end

  def requires_options?
    %w[single_choice multiple_choice scale commune_location weekly_schedule].include?(question_type)
  end

  # Méthode pour récupérer la configuration du planning
  def weekly_schedule_config
    return {} unless weekly_schedule_question?

    {
      days: options&.dig('days') || [],
      time_slots: options&.dig('time_slots') || [],
      allow_multiple_per_day: options&.dig('allow_multiple_per_day') || true
    }
  end

  private

  def set_position
    self.position ||= (survey_section.questions.maximum(:position) || 0) + 1
  end
end
