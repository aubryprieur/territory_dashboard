class CreateEpcis < ActiveRecord::Migration[8.0]
  def change
    create_table :epcis do |t|
      t.string :epci, null: false
      t.string :libepci
      t.string :nature_epci
      t.integer :nb_com

      t.timestamps
    end

    add_index :epcis, :epci, unique: true
  end
end
