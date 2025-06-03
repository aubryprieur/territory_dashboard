class AddUserSurveyToSurveyResponses < ActiveRecord::Migration[8.0]
  def change
    add_reference :survey_responses, :user_survey, null: false, foreign_key: true
  end
end
