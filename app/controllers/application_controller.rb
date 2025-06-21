class ApplicationController < ActionController::Base
  include SuspensionCheck  # Ajouter cette ligne

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  before_action :check_password_setup_required

  def dashboard_router
    redirect_to home_dashboard_path
  end

  private

  def check_password_setup_required
    return unless user_signed_in?
    return if current_user.super_admin?
    return if controller_name == 'password_setups' || devise_controller?
    return if controller_name == 'sessions' && action_name == 'destroy'
    return if controller_name == 'home_dashboard' # Permet l'accès à la page d'accueil

    if current_user.needs_password_setup?
      redirect_to users_password_setup_path, alert: "Vous devez configurer votre mot de passe pour continuer."
    end
  end
end
