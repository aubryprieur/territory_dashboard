class ApplicationController < ActionController::Base
  include SuspensionCheck  # Ajouter cette ligne

  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern

  # Dans app/controllers/application_controller.rb, ajoutez cette méthode:
  def dashboard_router
    if current_user.territory_type == 'epci'
      redirect_to epci_dashboard_path
    else
      redirect_to dashboard_path
    end
  end

end
