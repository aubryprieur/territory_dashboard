class User < ApplicationRecord
  devise :database_authenticatable, :recoverable, :rememberable, :validatable

  enum :role, { user: 0, super_admin: 1 }

  before_validation :populate_territory_name_for_commune, if: -> {
    territory_type == "commune" && territory_code.present? && territory_name.blank?
  }

  private

  def populate_territory_name_for_commune
    territory = Territory.find_by(codgeo: territory_code)
    self.territory_name = territory&.libgeo
  end
end
