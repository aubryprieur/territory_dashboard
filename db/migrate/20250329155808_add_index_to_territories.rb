class AddIndexToTerritories < ActiveRecord::Migration[8.0]
  def change
    add_index :territories, :libgeo
  end
end
