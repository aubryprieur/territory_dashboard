# Générez cette migration avec : rails generate migration AddConfirmableToUsers

class AddConfirmableToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :confirmation_token, :string
    add_column :users, :confirmed_at, :datetime
    add_column :users, :confirmation_sent_at, :datetime
    add_column :users, :unconfirmed_email, :string

    # Champs pour le mot de passe temporaire
    add_column :users, :password_set, :boolean, default: false
    add_column :users, :first_login, :boolean, default: true

    # Index pour optimiser les requêtes
    add_index :users, :confirmation_token, unique: true

    # Confirmer tous les utilisateurs existants
    User.update_all(confirmed_at: Time.current, password_set: true, first_login: false)
  end

  def down
    remove_index :users, :confirmation_token
    remove_column :users, :confirmation_token
    remove_column :users, :confirmed_at
    remove_column :users, :confirmation_sent_at
    remove_column :users, :unconfirmed_email
    remove_column :users, :password_set
    remove_column :users, :first_login
  end
end
