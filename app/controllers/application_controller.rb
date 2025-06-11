class ApplicationController < ActionController::Base
  include SuspensionCheck  # Ajouter cette ligne

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  before_action :check_password_setup_required

  # Dans app/controllers/application_controller.rb, ajoutez cette méthode:
  def dashboard_router
    if current_user.territory_type == 'epci'
      redirect_to epci_dashboard_path
    else
      redirect_to dashboard_path
    end
  end

  private

  def check_password_setup_required
    return unless user_signed_in?
    return if current_user.super_admin?
    return if controller_name == 'password_setups' || devise_controller?
    return if controller_name == 'sessions' && action_name == 'destroy'

    if current_user.needs_password_setup?
      redirect_to users_password_setup_path, alert: "Vous devez configurer votre mot de passe pour continuer."
    end
  end
end
