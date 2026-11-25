# Message envoyé depuis le formulaire de contact public. Non enregistré en base : il est seulement transmis par e-mail.
class ContactMessage
  include ActiveModel::Model
  include ActiveModel::Attributes

  SUBJECTS = {
    "presentation" => "Demander une présentation",
    "devis" => "Demander un devis",
    "question" => "Question sur l'outil ou les données",
    "acces" => "Problème d'accès à mon compte",
    "autre" => "Autre demande"
  }.freeze

  attribute :name, :string
  attribute :organization, :string
  attribute :email, :string
  attribute :phone, :string
  attribute :subject, :string
  attribute :territory, :string
  attribute :message, :string
  attribute :website, :string # champ piège invisible : rempli uniquement par les robots

  validates :name, presence: true, length: { maximum: 120 }
  validates :organization, presence: true, length: { maximum: 200 }
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }, length: { maximum: 200 }
  validates :phone, length: { maximum: 30 }
  validates :subject, inclusion: { in: SUBJECTS.keys }
  validates :territory, length: { maximum: 200 }
  validates :message, presence: true, length: { minimum: 10, maximum: 5000 }

  def self.human_attribute_name(attr, options = {})
    {
      "name" => "Nom", "organization" => "Organisation", "email" => "Adresse e-mail", "phone" => "Téléphone",
      "subject" => "Objet", "territory" => "Territoire concerné", "message" => "Message"
    }.fetch(attr.to_s) { super }
  end

  def subject_label
    SUBJECTS.fetch(subject, subject)
  end

  def spam?
    website.present?
  end
end
