class CreateQuestions < ActiveRecord::Migration[8.0]
  def change
    create_table :questions do |t|
      t.references :survey_section, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :question_type, null: false
      t.integer :position, null: false
      t.boolean :required, default: false
      t.json :options
      t.json :validation_rules
      t.json :conditional_logic

      t.timestamps
    end

    add_index :questions, [:survey_section_id, :position]
    add_index :questions, :question_type
  end
end
