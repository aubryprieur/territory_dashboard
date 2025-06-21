class HomeDashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    # Logique différente selon le type d'utilisateur
    if current_user.super_admin?
      render :admin_index
    else
      # Logique pour déterminer quel type de dashboard afficher
      @dashboard_path = determine_dashboard_path
      @dashboard_title = determine_dashboard_title
    end
  end

  private

  def determine_dashboard_path
    if current_user.territory_type == 'epci'
      epci_dashboard_path
    else
      dashboard_path
    end
  end

  def determine_dashboard_title
    if current_user.territory_type == 'epci'
      'Dashboard EPCI'
    else
      'Dashboard Commune'
    end
  end
end
