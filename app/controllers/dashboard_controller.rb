class DashboardController < ApplicationController
  include UserAuthorization
  before_action :check_user_territory

  def index
    @territory_code = current_user.territory_code
    @territory_name = current_user.territory_name

    # Récupérer les données de base pour la commune
    @population_data = Api::PopulationService.get_commune_data(@territory_code)
    @children_data = Api::PopulationService.get_children_data(@territory_code)
    @historical_data = Api::HistoricalService.get_historical_data(@territory_code)
    @revenue_data = Api::RevenueService.get_median_revenues(@territory_code)
    @schooling_data = Api::SchoolingService.get_commune_schooling(@territory_code)
    @childcare_data = Api::ChildcareService.get_coverage_by_commune(@territory_code)

    # Si l'utilisateur a une commune, récupérer les données EPCI associées
    if current_user.territory_type == 'commune'
      territory = Territory.find_by(codgeo: @territory_code)
      if territory&.epci.present?
        @epci_data = Api::PopulationService.get_epci_children_data(territory.epci)
      end
    end
  end

  private

  def check_user_territory
    unless current_user.territory_code.present?
      redirect_to root_path, alert: "Vous n'avez pas de territoire associé à votre compte."
    end
  end
end
