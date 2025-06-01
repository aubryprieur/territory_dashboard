class CreateSurveySections < ActiveRecord::Migration[8.0]
  def change
    create_table :survey_sections do |t|
      t.references :survey, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.integer :position, null: false
      t.boolean :required, default: false

      t.timestamps
    end

    add_index :survey_sections, [:survey_id, :position]
  end
end
