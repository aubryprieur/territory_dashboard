# Formulaire de contact public : le message est transmis par e-mail à l'adresse de contact (rien n'est stocké en base).
class ContactsController < ApplicationController
  skip_before_action :check_password_setup_required

  rate_limit to: 5, within: 1.hour, only: :create,
             with: -> { redirect_to contact_path, alert: "Trop de messages envoyés depuis votre connexion. Merci de réessayer plus tard ou de nous écrire directement." }

  def new
    @contact = ContactMessage.new(subject: params[:objet].presence_in(ContactMessage::SUBJECTS.keys) || "presentation")
    if user_signed_in?
      @contact.email = current_user.email
      @contact.organization = current_user.territory_name
      @contact.territory = current_user.territory_name
    end
  end

  def create
    @contact = ContactMessage.new(contact_params)

    # Robot détecté par le champ piège : on fait comme si l'envoi avait réussi, sans rien envoyer.
    return redirect_to(contact_sent_path) if @contact.spam?

    if @contact.valid?
      ContactMailer.new_message(@contact).deliver_now
      redirect_to contact_sent_path
    else
      render :new, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("[Contact] Échec de l'envoi : #{e.class} #{e.message}")
    flash.now[:alert] = "Votre message n'a pas pu être envoyé. Merci de réessayer ou de nous écrire à #{helpers.contact_email}."
    render :new, status: :unprocessable_entity
  end

  def sent; end

  private

  def contact_params
    params.require(:contact_message).permit(:name, :organization, :email, :phone, :subject, :territory, :message, :website)
  end
end
