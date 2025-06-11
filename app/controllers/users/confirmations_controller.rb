class Users::ConfirmationsController < Devise::ConfirmationsController
  protected

  # Rediriger après confirmation vers la configuration du mot de passe
  def after_confirmation_path_for(resource_name, resource)
    if resource.needs_password_setup?
      users_password_setup_path
    else
      authenticated_root_path
    end
  end

  # Personnaliser le message après confirmation
  def set_flash_message(key, kind, options = {})
    if kind == :confirmed && resource.needs_password_setup?
      flash[:notice] = "Votre email a été confirmé. Veuillez maintenant configurer votre mot de passe."
    else
      super
    end
  end
end
