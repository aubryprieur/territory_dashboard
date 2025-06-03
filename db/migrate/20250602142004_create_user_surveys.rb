class CreateUserSurveys < ActiveRecord::Migration[8.0]
  def change
    create_table :user_surveys do |t|
      t.references :user, null: false, foreign_key: true
      t.references :survey, null: false, foreign_key: true
      t.integer :year, null: false
      t.text :custom_welcome_message
      t.text :custom_thank_you_message
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.integer :status, default: 0, null: false
      t.string :public_token, null: false
      t.integer :response_count, default: 0

      t.timestamps
    end

    add_index :user_surveys, :public_token, unique: true
    add_index :user_surveys, [:user_id, :year]
    add_index :user_surveys, [:survey_id, :year]
    add_index :user_surveys, :status
    add_index :user_surveys, [:starts_at, :ends_at]
  end
end
