require 'zxcvbn'

class User < ApplicationRecord
  devise :database_authenticatable, :recoverable, :rememberable, :validatable, :confirmable

  has_many :user_surveys, dependent: :destroy

  enum :role, { user: 0, super_admin: 1 }

  # Scopes pour les utilisateurs suspendus
  scope :suspended, -> { where(suspended: true) }
  scope :active, -> { where(suspended: false) }

  # Validations pour le mot de passe renforcées
  validates :password,
    length: { minimum: 12, message: "doit contenir au moins 12 caractères" },
    format: {
      with: /\A(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      message: "doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial"
    },
    if: :password_required?

  # Validation de la force du mot de passe avec zxcvbn
  validate :password_strength, if: :password_required?

  before_validation :populate_territory_name_for_commune, if: -> {
    territory_type == "commune" && territory_code.present? && territory_name.blank?
  }

  # Override pour ne pas envoyer l'email de confirmation automatiquement
  def send_devise_notification(notification, *args)
    devise_mailer.send(notification, self, *args).deliver_later
  end

  def can_launch_surveys?
    !super_admin? && territory_code.present? && confirmed?
  end

  def active_surveys
    user_surveys.active
  end

  def can_view_user_survey?(user_survey)
    super_admin? || user_survey.user_id == id || (territory_type == 'epci' && user_survey.user.territory_type == 'commune' && user_survey.user.territory_code.in?(Territory.where(epci: territory_code).pluck(:codgeo)))
  end

  def can_access_dashboard?
    !suspended? && confirmed?
  end

  def needs_password_setup?
    !password_set? || first_login?
  end

  def complete_password_setup!
    update!(password_set: true, first_login: false)
  end

  # Méthodes pour gérer la suspension
  def suspend!(reason = nil)
    update!(
      suspended: true,
      suspended_at: Time.current,
      suspension_reason: reason
    )
  end

  def reactivate!
    update!(
      suspended: false,
      suspended_at: nil,
      suspension_reason: nil
    )
  end

  def suspension_duration
    return nil unless suspended? && suspended_at
    Time.current - suspended_at
  end

  def suspension_duration_in_days
    return 0 unless suspended? && suspended_at
    (Time.current.to_date - suspended_at.to_date).to_i
  end

  # Override pour empêcher l'accès aux données sensibles
  def accessible_user_surveys
    return UserSurvey.none if suspended? && !super_admin?
    user_surveys
  end

  private

  def populate_territory_name_for_commune
    territory = Territory.find_by(codgeo: territory_code)
    self.territory_name = territory&.libgeo
  end

  def password_required?
    !persisted? || !password.blank? || !password_confirmation.blank?
  end

  def password_strength
    return unless password.present?

    score = Zxcvbn.test(password, [email, territory_name].compact)

    if score.score < 3
      errors.add :password, "est trop faible. #{score.feedback.warning} #{score.feedback.suggestions.join(' ')}"
    end
  end
end
