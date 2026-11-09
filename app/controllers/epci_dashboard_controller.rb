# Tableau de bord EPCI : depuis novembre 2026, c'est le tableau de bord des communes en mode EPCI
# (DashboardController avec ?epci_code=…). Cette route garde l'adresse /epci_dashboard (menu, page d'accueil) et
# redirige vers la page de l'EPCI de l'utilisateur.
class EpciDashboardController < ApplicationController
  include UserAuthorization

  before_action :check_epci_user

  def index
    redirect_to dashboard_path(epci_code: current_user.territory_code)
  end

  private

  def check_epci_user
    return if current_user.territory_type == 'epci' && current_user.territory_code.present?
    redirect_to root_path, alert: "Ce dashboard est réservé aux utilisateurs EPCI."
  end
end
