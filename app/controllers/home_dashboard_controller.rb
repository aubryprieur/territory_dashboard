class HomeDashboardController < ApplicationController
  before_action :authenticate_user!

  def index
    # Logique pour déterminer quel type de dashboard afficher
    @dashboard_path = determine_dashboard_path
    @dashboard_title = determine_dashboard_title
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
