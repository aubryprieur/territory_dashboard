class Epci < ApplicationRecord
  validates :epci, presence: true, uniqueness: true

  # Relation avec les territoires
  has_many :territories, primary_key: :epci, foreign_key: :epci
end
