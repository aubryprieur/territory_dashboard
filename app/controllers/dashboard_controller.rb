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
    @births_data = Api::PopulationService.get_births_data(@territory_code)
    @births_data_filtered = @births_data&.select { |item| item["geo_object"] == "COM" } || []
    @employment_data = Api::EmploymentService.get_commune_employment(@territory_code)
    @safety_data = Api::PublicSafetyService.get_commune_safety(@territory_code)
    @family_data = Api::FamilyService.get_commune_families(@territory_code)

    # Récupérer les données pour la France
    @france_revenue_data = Api::RevenueService.get_median_revenues_france
    @france_schooling_data = Api::SchoolingService.get_france_schooling
    @france_children_data = Api::PopulationService.get_france_children_data
    @france_employment_data = Api::EmploymentService.get_france_employment
    @france_childcare_data = Api::ChildcareService.get_coverage_france
    @france_family_data = Api::FamilyService.get_france_families

    # Si l'utilisateur a une commune, récupérer les données EPCI, département et région associées
    if current_user.territory_type == 'commune'
      territory = Territory.find_by(codgeo: @territory_code)
      if territory
        if territory.epci.present?
          @epci_children_data = Api::PopulationService.get_epci_children_data(territory.epci)
          @epci_revenue_data = Api::RevenueService.get_median_revenues_epci(territory.epci)
          @epci_schooling_data = Api::SchoolingService.get_epci_schooling(territory.epci)
          @epci_employment_data = Api::EmploymentService.get_epci_employment(territory.epci)
          @epci_childcare_data = Api::ChildcareService.get_coverage_by_epci(territory.epci) if territory&.epci.present?
          @epci_family_data = Api::FamilyService.get_epci_families(territory.epci)
        end

        if territory.dep.present?
          @department_children_data = Api::PopulationService.get_department_children_data(territory.dep)
          @department_revenue_data = Api::RevenueService.get_median_revenues_department(territory.dep)
          @department_schooling_data = Api::SchoolingService.get_department_schooling(territory.dep)
          @department_employment_data = Api::EmploymentService.get_department_employment(territory.dep)
          @department_safety_data = Api::PublicSafetyService.get_department_safety(territory.dep)
          @department_childcare_data = Api::ChildcareService.get_coverage_by_department(territory.dep) if territory&.dep.present?
          @department_family_data = Api::FamilyService.get_department_families(territory.dep)
        end

        if territory.reg.present?
          @region_children_data = Api::PopulationService.get_region_children_data(territory.reg)
          @region_revenue_data = Api::RevenueService.get_median_revenues_region(territory.reg)
          @region_schooling_data = Api::SchoolingService.get_region_schooling(territory.reg)
          @region_employment_data = Api::EmploymentService.get_region_employment(territory.reg)
          @region_safety_data = Api::PublicSafetyService.get_region_safety(territory.reg)
          @region_childcare_data = Api::ChildcareService.get_coverage_by_region(territory.reg) if territory&.reg.present?
          @region_family_data = Api::FamilyService.get_region_families(territory.reg)
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
