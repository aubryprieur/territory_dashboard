class CreateSurveyResponses < ActiveRecord::Migration[8.0]
  def change
    create_table :survey_responses do |t|
      t.references :survey, null: false, foreign_key: true
      t.references :user, null: true, foreign_key: true
      t.string :session_id
      t.boolean :completed, default: false
      t.datetime :started_at
      t.datetime :completed_at
      t.string :ip_address
      t.string :user_agent
      t.json :metadata

      t.timestamps
    end

    add_index :survey_responses, :completed
    add_index :survey_responses, :session_id
  end
end
