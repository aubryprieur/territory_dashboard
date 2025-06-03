class Survey < ApplicationRecord
  belongs_to :created_by, class_name: 'User'
  has_many :survey_sections, -> { order(:position) }, dependent: :destroy
  has_many :questions, through: :survey_sections
  has_many :survey_responses, dependent: :destroy
  has_many :user_surveys, dependent: :restrict_with_error

  validates :title, presence: true
  validates :created_by, presence: true

  scope :templates, -> { where(is_template: true) }
  scope :published, -> { where(published: true) }
  scope :active, -> { where(published: true).where('expires_at IS NULL OR expires_at > ?', Time.current) }

  def publish!
    update!(published: true, published_at: Time.current)
  end

  def close!
    update!(published: false)
  end

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def total_questions
    questions.count
  end

  def response_count
    survey_responses.where(completed: true).count
  end

  def duplicate_as_template
    new_survey = self.dup
    new_survey.is_template = true
    new_survey.published = false
    new_survey.title = "#{title} (Modèle)"

    new_survey.save!

    survey_sections.each do |section|
      new_section = section.dup
      new_section.survey = new_survey
      new_section.save!

      section.questions.each do |question|
        new_question = question.dup
        new_question.survey_section = new_section
        new_question.save!

        question.question_options.each do |option|
          new_option = option.dup
          new_option.question = new_question
          new_option.save!
        end
      end
    end

    new_survey
  end

  def available_for_users?
    published? && !expired? && !is_template?
  end

  def active_user_surveys_count
    user_surveys.active.count
  end

  def total_responses_across_all_instances
    survey_responses.completed.count + user_surveys.sum(:response_count)
  end
end
