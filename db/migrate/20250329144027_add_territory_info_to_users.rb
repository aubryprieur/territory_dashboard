class AddTerritoryInfoToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :territory_type, :string
    add_column :users, :territory_code, :string
    add_column :users, :territory_name, :string

    add_index :users, [:territory_type, :territory_code]
  end
end
