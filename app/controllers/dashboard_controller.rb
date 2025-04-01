class DashboardController < ApplicationController
  include UserAuthorization
  before_action :check_user_territory

def index
  @territory_code = current_user.territory_code
  @territory_name = current_user.territory_name

  # Récupérer les données de base pour la commune
  @population_data = Api::PopulationService.get_commune_data(@territory_code)
  @total_population = @population_data.present? ? @population_data.sum { |item| item["NB"].to_f }.round : 0
  @children_data = Api::PopulationService.get_children_data(@territory_code)
  @historical_data = Api::HistoricalService.get_historical_data(@territory_code)
  @revenue_data = Api::RevenueService.get_median_revenues(@territory_code)
  @schooling_data = Api::SchoolingService.get_commune_schooling(@territory_code)
  @childcare_data = Api::ChildcareService.get_coverage_by_commune(@territory_code)

  # Récupérer les données pour la France
  @france_revenue_data = Api::RevenueService.get_median_revenues_france

  # Si l'utilisateur a une commune, récupérer les données EPCI, département et région associées
  if current_user.territory_type == 'commune'
    territory = Territory.find_by(codgeo: @territory_code)
    if territory
      if territory.epci.present?
        @epci_data = Api::PopulationService.get_epci_children_data(territory.epci)
        @epci_revenue_data = Api::RevenueService.get_median_revenues_epci(territory.epci)
      end

      if territory.dep.present?
        @department_revenue_data = Api::RevenueService.get_median_revenues_department(territory.dep)
      end

      if territory.reg.present?
        @region_revenue_data = Api::RevenueService.get_median_revenues_region(territory.reg)
      end
    end
  end
end

  private

  def check_user_territory
    # Si l'utilisateur n'a pas de territoire associé
    unless current_user.territory_code.present?
      # Si c'est un super_admin, rediriger vers la gestion des utilisateurs
      if current_user.super_admin?
        redirect_to admin_users_path, notice: "En tant que Super Admin, vous avez été redirigé vers la gestion des utilisateurs."
      else
        # Pour un utilisateur normal sans territoire (cas qui ne devrait pas se produire selon vos règles)
        redirect_to root_path, alert: "Vous n'avez pas de territoire associé à votre compte. Veuillez contacter un administrateur."
      end
    end
  end
end
