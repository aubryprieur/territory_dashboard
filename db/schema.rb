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

ActiveRecord::Schema[8.0].define(version: 2025_06_09_145456) do
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

  create_table "question_options", force: :cascade do |t|
    t.bigint "question_id", null: false
    t.string "text", null: false
    t.string "value"
    t.integer "position", null: false
    t.boolean "has_other_option", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["question_id", "position"], name: "index_question_options_on_question_id_and_position"
    t.index ["question_id"], name: "index_question_options_on_question_id"
  end

  create_table "question_responses", force: :cascade do |t|
    t.bigint "survey_response_id", null: false
    t.bigint "question_id", null: false
    t.text "answer_text"
    t.json "answer_data"
    t.boolean "skipped", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["question_id"], name: "index_question_responses_on_question_id"
    t.index ["survey_response_id", "question_id"], name: "index_question_responses_on_survey_response_and_question", unique: true
    t.index ["survey_response_id"], name: "index_question_responses_on_survey_response_id"
  end

  create_table "questions", force: :cascade do |t|
    t.bigint "survey_section_id", null: false
    t.string "title", null: false
    t.text "description"
    t.string "question_type", null: false
    t.integer "position", null: false
    t.boolean "required", default: false
    t.json "options"
    t.json "validation_rules"
    t.json "conditional_logic"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["question_type"], name: "index_questions_on_question_type"
    t.index ["survey_section_id", "position"], name: "index_questions_on_survey_section_id_and_position"
    t.index ["survey_section_id"], name: "index_questions_on_survey_section_id"
  end

  create_table "survey_responses", force: :cascade do |t|
    t.bigint "survey_id", null: false
    t.bigint "user_id"
    t.string "session_id"
    t.boolean "completed", default: false
    t.datetime "started_at"
    t.datetime "completed_at"
    t.string "ip_address"
    t.string "user_agent"
    t.json "metadata"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_survey_id", null: false
    t.index ["completed"], name: "index_survey_responses_on_completed"
    t.index ["completed_at"], name: "index_survey_responses_on_completed_at"
    t.index ["session_id"], name: "index_survey_responses_on_session_id"
    t.index ["started_at"], name: "index_survey_responses_on_started_at"
    t.index ["survey_id", "completed"], name: "index_survey_responses_on_survey_and_completed"
    t.index ["survey_id"], name: "index_survey_responses_on_survey_id"
    t.index ["user_id"], name: "index_survey_responses_on_user_id"
    t.index ["user_survey_id"], name: "index_survey_responses_on_user_survey_id"
  end

  create_table "survey_sections", force: :cascade do |t|
    t.bigint "survey_id", null: false
    t.string "title", null: false
    t.text "description"
    t.integer "position", null: false
    t.boolean "required", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["survey_id", "position"], name: "index_survey_sections_on_survey_id_and_position"
    t.index ["survey_id"], name: "index_survey_sections_on_survey_id"
  end

  create_table "surveys", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.boolean "is_template", default: false
    t.boolean "published", default: false
    t.bigint "created_by_id", null: false
    t.datetime "published_at"
    t.datetime "expires_at"
    t.text "welcome_message"
    t.text "thank_you_message"
    t.boolean "allow_anonymous", default: true
    t.boolean "show_progress_bar", default: true
    t.json "settings"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_surveys_on_created_by_id"
    t.index ["expires_at"], name: "index_surveys_on_expires_at"
    t.index ["is_template"], name: "index_surveys_on_is_template"
    t.index ["published", "expires_at"], name: "index_surveys_on_published_and_expires_at"
    t.index ["published"], name: "index_surveys_on_published"
    t.index ["published_at"], name: "index_surveys_on_published_at"
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

  create_table "user_surveys", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "survey_id", null: false
    t.integer "year", null: false
    t.text "custom_welcome_message"
    t.text "custom_thank_you_message"
    t.datetime "starts_at", null: false
    t.datetime "ends_at", null: false
    t.integer "status", default: 0, null: false
    t.string "public_token", null: false
    t.integer "response_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["public_token"], name: "index_user_surveys_on_public_token", unique: true
    t.index ["starts_at", "ends_at"], name: "index_user_surveys_on_starts_at_and_ends_at"
    t.index ["status"], name: "index_user_surveys_on_status"
    t.index ["survey_id", "year"], name: "index_user_surveys_on_survey_id_and_year"
    t.index ["survey_id"], name: "index_user_surveys_on_survey_id"
    t.index ["user_id", "year"], name: "index_user_surveys_on_user_id_and_year"
    t.index ["user_id"], name: "index_user_surveys_on_user_id"
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
    t.boolean "suspended", default: false, null: false
    t.datetime "suspended_at", precision: nil
    t.text "suspension_reason"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["suspended"], name: "index_users_on_suspended"
    t.index ["suspended_at"], name: "index_users_on_suspended_at"
    t.index ["territory_type", "territory_code"], name: "index_users_on_territory_type_and_territory_code"
  end

  add_foreign_key "question_options", "questions"
  add_foreign_key "question_responses", "questions"
  add_foreign_key "question_responses", "survey_responses"
  add_foreign_key "questions", "survey_sections"
  add_foreign_key "survey_responses", "surveys"
  add_foreign_key "survey_responses", "user_surveys"
  add_foreign_key "survey_responses", "users"
  add_foreign_key "survey_sections", "surveys"
  add_foreign_key "surveys", "users", column: "created_by_id"
  add_foreign_key "user_surveys", "surveys"
  add_foreign_key "user_surveys", "users"
end
