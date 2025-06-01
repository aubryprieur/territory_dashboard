class CreateQuestionResponses < ActiveRecord::Migration[8.0]
  def change
    create_table :question_responses do |t|
      t.references :survey_response, null: false, foreign_key: true
      t.references :question, null: false, foreign_key: true
      t.text :answer_text
      t.json :answer_data
      t.boolean :skipped, default: false

      t.timestamps
    end

    add_index :question_responses, [:survey_response_id, :question_id], unique: true, name: 'index_question_responses_on_survey_response_and_question'
  end
end
