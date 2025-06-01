class AddIndexesToSurveys < ActiveRecord::Migration[8.0]
  def change
    # Index supplémentaires pour les performances
    add_index :surveys, :expires_at
    add_index :surveys, [:published, :expires_at], name: 'index_surveys_on_published_and_expires_at'
    add_index :surveys, :published_at
    add_index :survey_responses, [:survey_id, :completed], name: 'index_survey_responses_on_survey_and_completed'
    add_index :survey_responses, :started_at
    add_index :survey_responses, :completed_at
  end
end
