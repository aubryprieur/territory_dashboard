class AddSuspensionToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :suspended, :boolean, default: false, null: false
    add_column :users, :suspended_at, :timestamp
    add_column :users, :suspension_reason, :text

    # Index pour les requêtes de filtrage
    add_index :users, :suspended
    add_index :users, :suspended_at
  end
end
