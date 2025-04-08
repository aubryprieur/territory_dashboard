# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_04_08_123510) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "unaccent"

  create_table "commune_geometries", force: :cascade do |t|
    t.string "code_insee", null: false
    t.string "nom"
    t.string "epci"
    t.text "geojson"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["code_insee"], name: "index_commune_geometries_on_code_insee", unique: true
    t.index ["epci"], name: "index_commune_geometries_on_epci"
  end

  create_table "epcis", force: :cascade do |t|
    t.string "epci", null: false
    t.string "libepci"
    t.string "nature_epci"
    t.integer "nb_com"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["epci"], name: "index_epcis_on_epci", unique: true
  end

  create_table "territories", force: :cascade do |t|
    t.string "libgeo"
    t.string "codgeo"
    t.string "epci"
    t.string "dep"
    t.string "reg"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["libgeo"], name: "index_territories_on_libgeo"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "role", default: 0
    t.string "territory_type"
    t.string "territory_code"
    t.string "territory_name"
    t.text "commune_codes"
    t.text "commune_names"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["territory_type", "territory_code"], name: "index_users_on_territory_type_and_territory_code"
  end
end
