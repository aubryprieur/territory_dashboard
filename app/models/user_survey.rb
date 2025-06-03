class UserSurvey < ApplicationRecord
  belongs_to :user
  belongs_to :survey
  has_many :survey_responses, dependent: :destroy

  # Statuts
  enum :status, {
    draft: 0,      # En préparation
    active: 1,     # En cours
    closed: 2,     # Terminée
    archived: 3    # Archivée
  }

  # Validations
  validates :user, presence: true
  validates :survey, presence: true
  validates :year, presence: true, numericality: {
    greater_than_or_equal_to: 2020,
    less_than_or_equal_to: -> { Date.current.year + 1 }
  }
  validates :starts_at, presence: true
  validates :ends_at, presence: true
  validates :public_token, presence: true, uniqueness: true
  validate :end_date_after_start_date
  validate :survey_must_be_published

  # Callbacks
  before_validation :generate_public_token, on: :create
  before_save :update_status_based_on_dates

  # Scopes
  scope :for_user, ->(user) { where(user: user) }
  scope :for_year, ->(year) { where(year: year) }
  scope :current, -> { where(status: :active) }
  scope :upcoming, -> { where(status: :draft).where('starts_at > ?', Time.current) }
  scope :past, -> { where(status: [:closed, :archived]) }
  scope :accessible_by_user, ->(user) {
    if user.super_admin?
      all
    elsif user.territory_type == 'epci'
      # Un utilisateur EPCI peut voir les enquêtes de ses communes membres
      epci_code = user.territory_code
      commune_codes = Territory.where(epci: epci_code).pluck(:codgeo)
      user_ids = User.where(territory_type: 'commune', territory_code: commune_codes).pluck(:id)
      where(user_id: [user.id] + user_ids)
    else
      where(user_id: user.id)
    end
  }

  # Instance methods
  def active?
    status == 'active' && Time.current.between?(starts_at, ends_at)
  end

  def upcoming?
    status == 'draft' && starts_at > Time.current
  end

  def past?
    status == 'closed' || ends_at < Time.current
  end

  def can_receive_responses?
    active? && survey.published?
  end

  def public_url
    Rails.application.routes.url_helpers.public_survey_url(public_token, host: Rails.application.config.action_mailer.default_url_options[:host])
  end

  def welcome_message
    custom_welcome_message.presence || survey.welcome_message
  end

  def thank_you_message
    custom_thank_you_message.presence || survey.thank_you_message
  end

  def response_rate
    return 0 if response_count.zero?
    # Calculer en fonction du nombre potentiel de répondants (à définir selon le contexte)
    response_count
  end

  def activate!
    update!(status: :active) if can_activate?
  end

  def close!
    update!(status: :closed)
  end

  def archive!
    update!(status: :archived) if closed?
  end

  def duplicate_for_year(new_year)
    new_survey = self.dup
    new_survey.year = new_year
    new_survey.status = :draft
    new_survey.response_count = 0
    new_survey.starts_at = starts_at + (new_year - year).years
    new_survey.ends_at = ends_at + (new_year - year).years
    new_survey.generate_public_token
    new_survey.save!
    new_survey
  end

  private

  def generate_public_token
    self.public_token ||= loop do
      token = SecureRandom.urlsafe_base64(16)
      break token unless UserSurvey.exists?(public_token: token)
    end
  end

  def end_date_after_start_date
    return unless starts_at && ends_at
    errors.add(:ends_at, "doit être après la date de début") if ends_at <= starts_at
  end

  def survey_must_be_published
    errors.add(:survey, "doit être publiée") unless survey&.published?
  end

  def update_status_based_on_dates
    if starts_at_changed? || ends_at_changed?
      now = Time.current
      if now < starts_at
        self.status = :draft
      elsif now >= starts_at && now <= ends_at
        self.status = :active if draft?
      elsif now > ends_at
        self.status = :closed if active?
      end
    end
  end

  def can_activate?
    draft? && Time.current >= starts_at && Time.current < ends_at
  end
end
