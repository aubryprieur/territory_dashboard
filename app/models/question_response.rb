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
end
