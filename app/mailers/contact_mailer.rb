class ContactMailer < ApplicationMailer
  # Message du formulaire de contact, envoyé à l'adresse de contact ; « Répondre » écrit directement au visiteur.
  def new_message(contact)
    @contact = contact
    mail(
      to: ApplicationController.helpers.contact_email,
      reply_to: contact.email,
      subject: "[Observatoire – contact] #{contact.subject_label} – #{contact.organization.to_s.truncate(60)}"
    )
  end
end
