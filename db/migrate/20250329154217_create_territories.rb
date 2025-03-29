class CreateTerritories < ActiveRecord::Migration[8.0]
  def change
    create_table :territories do |t|
      t.string :libgeo
      t.string :codgeo
      t.string :epci
      t.string :dep
      t.string :reg

      t.timestamps
    end
  end
end
