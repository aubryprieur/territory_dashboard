class EpciDashboardController < ApplicationController
  include UserAuthorization
  before_action :check_epci_user

  def index
    @epci_code = current_user.territory_code
    @epci_name = current_user.territory_name

    # Récupérer les données EPCI
    @epci_communes_data = Api::EpciCommunesService.get_children_by_communes(@epci_code)
    @epci_children_data = Api::PopulationService.get_epci_children_data(@epci_code)
    @epci_revenue_data = Api::RevenueService.get_median_revenues_epci(@epci_code)
    @epci_family_data = Api::FamilyService.get_epci_families(@epci_code)
    @epci_schooling_data = Api::SchoolingService.get_epci_schooling(@epci_code)
    @epci_childcare_data = Api::ChildcareService.get_coverage_by_epci(@epci_code)

    # Préparation des données pour les graphiques
    prepare_communes_chart_data if @epci_communes_data.present?
  end

  private

  def check_epci_user
    unless current_user.territory_type == 'epci' && current_user.territory_code.present?
      redirect_to root_path, alert: "Ce dashboard est réservé aux utilisateurs EPCI."
    end
  end

  def prepare_communes_chart_data
    communes = @epci_communes_data["communes"].sort_by { |c| -c["under_3_rate"] }

    @communes_under3_data = {
      commune_names: communes.map { |c| c["name"] },
      under3_rates: communes.map { |c| c["under_3_rate"] },
      children_under3_counts: communes.map { |c| c["children_under_3"].round },
      commune_codes: communes.map { |c| c["code"] },
      commune_populations: communes.map { |c| c["total_population"].round }
    }
  end
end
