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

    # Récupérer les données France
    @france_children_data = Api::PopulationService.get_france_children_data

    # Déterminer le département et la région principale de l'EPCI
    epci_object = Epci.find_by(epci: @epci_code)
    if epci_object && epci_object.territories.any?
      # Trouver le département le plus représenté dans l'EPCI
      department_counts = epci_object.territories.group(:dep).count
      main_department_code = department_counts.max_by { |_, count| count }&.first

      # Trouver la région associée à ce département
      main_region_code = epci_object.territories.where(dep: main_department_code).first&.reg

      if main_department_code.present?
        @department_children_data = Api::PopulationService.get_department_children_data(main_department_code)
        @department_code = main_department_code
        @department_name = "Département " + main_department_code
      end

      if main_region_code.present?
        @region_children_data = Api::PopulationService.get_region_children_data(main_region_code)
        @region_code = main_region_code
        @region_name = "Région " + main_region_code
      end

      # Récupérer les données géographiques des communes de l'EPCI
      prepare_geojson_data if @epci_communes_data.present?

      # Préparation des données pour les graphiques
      prepare_communes_chart_data if @epci_communes_data.present?
    end
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

  def prepare_geojson_data
    # Préparer le GeoJSON pour les communes de l'EPCI - Pour les enfants de moins de 3 ans
    features = []

    @epci_communes_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      territory = Territory.find_by(codgeo: commune["code"])
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])

      next unless geometry&.geojson.present?

      # Créer un feature GeoJSON avec les propriétés dont nous avons besoin
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          under3_rate: commune["under_3_rate"],
          children_under3: commune["children_under_3"].round,
          population: commune["total_population"].round
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features << feature
    end

    @communes_geojson = {
      type: "FeatureCollection",
      features: features
    }.to_json

    # Préparer le GeoJSON pour les communes de l'EPCI - Pour les enfants de 3 à 5 ans
    features_3to5 = []

    @epci_communes_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])

      next unless geometry&.geojson.present?

      # Créer un feature GeoJSON avec les propriétés dont nous avons besoin
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          rate_3to5: commune["three_to_five_rate"],
          children_3to5: commune["children_3_to_5"].round,
          population: commune["total_population"].round
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_3to5 << feature
    end

    @communes_geojson_3to5 = {
      type: "FeatureCollection",
      features: features_3to5
    }.to_json
  end
end
