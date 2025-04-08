class CreateCommuneGeometries < ActiveRecord::Migration[8.0]
  def change
    create_table :commune_geometries do |t|
      t.string :code_insee, null: false
      t.string :nom
      t.string :epci
      t.text :geojson

      t.timestamps

      t.index :code_insee, unique: true
      t.index :epci
    end
  end
end
