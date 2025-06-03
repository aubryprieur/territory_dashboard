class User < ApplicationRecord
  devise :database_authenticatable, :recoverable, :rememberable, :validatable

  has_many :user_surveys, dependent: :destroy

  enum :role, { user: 0, super_admin: 1 }

  before_validation :populate_territory_name_for_commune, if: -> {
    territory_type == "commune" && territory_code.present? && territory_name.blank?
  }

  def can_launch_surveys?
    !super_admin? && territory_code.present?
  end

  def active_surveys
    user_surveys.active
  end

  def can_view_user_survey?(user_survey)
    super_admin? || user_survey.user_id == id || (territory_type == 'epci' && user_survey.user.territory_type == 'commune' && user_survey.user.territory_code.in?(Territory.where(epci: territory_code).pluck(:codgeo)))
  end

  private

  def populate_territory_name_for_commune
    territory = Territory.find_by(codgeo: territory_code)
    self.territory_name = territory&.libgeo
  end
end
