class QuestionOption < ApplicationRecord
  belongs_to :question

  validates :text, presence: true
  validates :position, presence: true, uniqueness: { scope: :question_id }

  before_validation :set_position, on: :create
  before_validation :set_value, on: :create

  private

  def set_position
    self.position ||= (question.question_options.maximum(:position) || 0) + 1
  end

  def set_value
    self.value ||= text.downcase.gsub(/[^a-z0-9]/, '_') if text.present?
  end
end
