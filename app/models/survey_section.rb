class SurveySection < ApplicationRecord
  belongs_to :survey
  has_many :questions, -> { order(:position) }, dependent: :destroy

  validates :title, presence: true
  validates :position, presence: true, uniqueness: { scope: :survey_id }

  before_validation :set_position, on: :create

  private

  def set_position
    self.position ||= (survey.survey_sections.maximum(:position) || 0) + 1
  end
end
