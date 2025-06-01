class CreateSurveys < ActiveRecord::Migration[8.0]
  def change
    create_table :surveys do |t|
      t.string :title, null: false
      t.text :description
      t.boolean :is_template, default: false
      t.boolean :published, default: false
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.datetime :published_at
      t.datetime :expires_at
      t.text :welcome_message
      t.text :thank_you_message
      t.boolean :allow_anonymous, default: true
      t.boolean :show_progress_bar, default: true
      t.json :settings

      t.timestamps
    end

    add_index :surveys, :is_template
    add_index :surveys, :published
  end
end
