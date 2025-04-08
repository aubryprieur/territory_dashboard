class CommuneGeometry < ApplicationRecord
  validates :code_insee, presence: true, uniqueness: true

  # Relation avec Territory
  belongs_to :territory, foreign_key: :code_insee, primary_key: :codgeo, optional: true
end
