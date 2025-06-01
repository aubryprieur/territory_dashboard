class SurveyResponse < ApplicationRecord
  belongs_to :survey
  belongs_to :user, optional: true
  has_many :question_responses, dependent: :destroy

  validates :survey, presence: true
  validates :session_id, presence: true, if: -> { user.blank? }

  scope :completed, -> { where(completed: true) }
  scope :in_progress, -> { where(completed: false) }

  before_validation :set_session_id, on: :create
  before_validation :set_started_at, on: :create

  def complete!
    update!(completed: true, completed_at: Time.current)
  end

  def progress_percentage
    return 0 if survey.total_questions.zero?
    (question_responses.count.to_f / survey.total_questions * 100).round
  end

  def answer_for(question)
    question_responses.find_by(question: question)
  end

  private

  def set_session_id
    self.session_id ||= SecureRandom.hex(16) if user.blank?
  end

  def set_started_at
    self.started_at ||= Time.current
  end
end
