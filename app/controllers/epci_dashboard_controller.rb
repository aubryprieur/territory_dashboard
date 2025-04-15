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
    @epci_births_data = Api::EpciBirthsService.get_births_by_communes(@epci_code)
    @epci_population_data = Api::EpciPopulationService.get_population_data(@epci_code)

    # Préparer les données pour la pyramide des âges de l'EPCI
    @epci_age_pyramid_data = prepare_epci_age_pyramid_data(@epci_population_data)

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
      if @epci_communes_data.present?
        prepare_geojson_data
        # Préparation des données pour les graphiques
        prepare_communes_chart_data
      end

      # Ajouter l'appel à la méthode de préparation des données de naissances
      prepare_births_geojson_data if @epci_births_data.present?
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

  def prepare_births_geojson_data
    # Préparer le GeoJSON pour les naissances par commune
    features_births = []

    # Récupérer l'année la plus récente
    latest_year = @epci_births_data["years_available"].max.to_s

    @epci_births_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le nombre de naissances pour la dernière année disponible
      births_count = commune["births_by_year"][latest_year].to_f

      # Créer un feature GeoJSON avec les propriétés dont nous avons besoin
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          births_count: births_count.round,
          latest_year: latest_year.to_i
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_births << feature
    end

    @communes_births_geojson = {
      type: "FeatureCollection",
      features: features_births
    }.to_json

    # Stocker l'année la plus récente pour l'affichage
    @epci_latest_birth_year = latest_year.to_i
  end

  def prepare_epci_age_pyramid_data(population_data)
    return {} if population_data.blank? || !population_data.key?("population_by_age")

    # Extraire les données de population par âge
    population_by_age = population_data["population_by_age"]

    # Initialiser les tableaux
    age_groups = []
    male_counts = []
    female_counts = []

    # Remplir les tableaux avec les données
    population_by_age.each do |age_data|
      age = age_data["age"].to_s
      male_count = age_data["men"].to_f.round
      female_count = age_data["women"].to_f.round

      age_groups << age
      male_counts << male_count
      female_counts << female_count
    end

    # Inverser les tableaux pour que les plus jeunes soient en bas
    result = {
      ageGroups: age_groups.reverse,
      maleData: male_counts.reverse,
      femaleData: female_counts.reverse
    }

    Rails.logger.debug "EPCI Age pyramid data: #{result.inspect}"

    result
  end
end
