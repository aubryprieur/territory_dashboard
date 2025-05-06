class EpciDashboardController < ApplicationController
  include UserAuthorization
  before_action :check_epci_user

  def index
    @epci_code = current_user.territory_code
    @epci_name = current_user.territory_name

    # Récupérer les données EPCI
    @epci_communes_data = Api::EpciCommunesService.get_children_by_communes(@epci_code)
    @epci_children_data = Api::PopulationService.get_epci_children_data(@epci_code)
    @epci_family_data = Api::FamilyService.get_epci_families(@epci_code)
    @epci_schooling_data = Api::SchoolingService.get_epci_schooling(@epci_code)
    @epci_childcare_data = Api::ChildcareService.get_coverage_by_epci(@epci_code)
    @epci_births_data = Api::EpciBirthsService.get_births_by_communes(@epci_code)
    @epci_population_data = Api::EpciPopulationService.get_population_data(@epci_code)
    @epci_historical_data = Api::EpciHistoricalService.get_historical_data(@epci_code)
    @epci_revenues_data = Api::EpciRevenuesService.get_epci_revenues(@epci_code)
    @epci_revenue_data = Api::RevenueService.get_median_revenues_epci(@epci_code)
    @epci_families_data = Api::EpciFamiliesService.get_couples_with_children(@epci_code)
    @epci_single_parent_data = Api::EpciFamiliesService.get_single_parent_families(@epci_code)
    @epci_large_families_data = Api::EpciFamiliesService.get_large_families(@epci_code)
    @epci_schooling_communes_data = Api::EpciSchoolingService.get_schooling_by_communes(@epci_code)
    @epci_schooling_data = Api::SchoolingService.get_epci_schooling(@epci_code)
    @epci_childcare_communes_data = Api::EpciChildcareService.get_coverage_by_communes(@epci_code)

# Appeler une nouvelle méthode pour préparer les données GeoJSON
prepare_childcare_geojson_data if @epci_childcare_communes_data.present?
    # Préparer les données pour la pyramide des âges de l'EPCI
    @epci_age_pyramid_data = prepare_epci_age_pyramid_data(@epci_population_data)
prepare_childcare_geojson_data if @epci_childcare_communes_data.present?

    # Récupérer les données France
    @france_children_data = Api::PopulationService.get_france_children_data
    @france_revenue_data = Api::RevenueService.get_median_revenues_france
    @france_family_data = Api::FamilyService.get_france_families
    @france_schooling_data = Api::SchoolingService.get_france_schooling
    @france_childcare_data = Api::ChildcareService.get_coverage_france

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
        @department_revenue_data = Api::RevenueService.get_median_revenues_department(main_department_code)
        @department_family_data = Api::FamilyService.get_department_families(@department_code)
        @department_schooling_data = Api::SchoolingService.get_department_schooling(@department_code)
        @department_childcare_data = Api::ChildcareService.get_coverage_by_department(main_department_code)
      end

      if main_region_code.present?
        @region_children_data = Api::PopulationService.get_region_children_data(main_region_code)
        @region_code = main_region_code
        @region_name = "Région " + main_region_code
        @region_revenue_data = Api::RevenueService.get_median_revenues_region(main_region_code)
        @region_family_data = Api::FamilyService.get_region_families(@region_code)
        @region_schooling_data = Api::SchoolingService.get_region_schooling(@region_code)
        @region_childcare_data = Api::ChildcareService.get_coverage_by_region(main_region_code)
      end

      # Récupérer les données géographiques des communes de l'EPCI
      if @epci_communes_data.present?
        prepare_geojson_data
        # Préparation des données pour les graphiques
        prepare_communes_chart_data
      end

      # Ajouter l'appel à la méthode de préparation des données
      prepare_births_geojson_data if @epci_births_data.present?
      prepare_revenues_geojson_data if @epci_revenues_data.present?
      prepare_families_geojson_data if @epci_families_data.present?
      prepare_single_parent_geojson_data if @epci_single_parent_data.present?
      prepare_large_families_geojson_data if @epci_large_families_data.present?
      prepare_schooling_geojson_data if @epci_schooling_communes_data.present?
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

  def prepare_revenues_geojson_data
    # Préparer le GeoJSON pour les revenus médians par commune
    features_revenues = []

    # Récupérer l'année la plus récente
    latest_year = @epci_revenues_data["latest_year"].to_s

    @epci_revenues_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le revenu médian et taux de pauvreté pour la dernière année disponible
      median_revenue = commune["median_revenues"][latest_year].to_f
      poverty_rate = commune["poverty_rates"][latest_year]

      # Créer un feature GeoJSON avec les propriétés dont nous avons besoin
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          median_revenue: median_revenue,
          poverty_rate: poverty_rate,
          latest_year: latest_year
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_revenues << feature
    end

    @communes_revenues_geojson = {
      type: "FeatureCollection",
      features: features_revenues
    }.to_json

    # Stocker l'année la plus récente pour l'affichage
    @epci_latest_revenue_year = latest_year.to_i
  end

  def prepare_families_geojson_data
    # Préparer le GeoJSON pour les couples avec enfants par commune
    features_families = []

    @epci_families_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le pourcentage de couples avec enfants
      couples_percentage = commune["couples_with_children_percentage"].to_f

      # Créer un feature GeoJSON avec les propriétés dont nous avons besoin
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          couples_percentage: couples_percentage,
          couples_count: commune["couples_with_children"].round,
          total_households: commune["total_households"].round,
          year: @epci_families_data["year"]
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_families << feature
    end

    @communes_families_geojson = {
      type: "FeatureCollection",
      features: features_families
    }.to_json
  end

  def prepare_single_parent_geojson_data
    # Préparer le GeoJSON pour les familles monoparentales par commune
    features_single_parent = []

    @epci_single_parent_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le pourcentage de familles monoparentales
      single_parent_percentage = commune["single_parent_percentage"].to_f

      # Créer un feature GeoJSON avec les propriétés dont nous avons besoin
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          single_parent_percentage: single_parent_percentage,
          single_parent_count: commune["single_parent_families"].round,
          single_fathers_percentage: commune["single_father_percentage"].to_f,
          single_mothers_percentage: commune["single_mother_percentage"].to_f,
          total_households: commune["total_households"].round,
          year: @epci_single_parent_data["year"]
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_single_parent << feature
    end

    @communes_single_parent_geojson = {
      type: "FeatureCollection",
      features: features_single_parent
    }.to_json
  end

  def prepare_large_families_geojson_data
    # Préparer le GeoJSON pour les familles nombreuses par commune
    features_large_families = []

    @epci_large_families_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le pourcentage de familles nombreuses
      large_families_percentage = commune["large_families_percentage"].to_f

      # Créer un feature GeoJSON avec les propriétés dont nous avons besoin
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          large_families_percentage: large_families_percentage,
          large_families_count: commune["large_families"].round,
          families_3_children_percentage: commune["families_3_children_percentage"].to_f,
          families_4_plus_percentage: commune["families_4_plus_percentage"].to_f,
          total_households: commune["total_households"].round,
          year: @epci_large_families_data["year"]
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_large_families << feature
    end

    @communes_large_families_geojson = {
      type: "FeatureCollection",
      features: features_large_families
    }.to_json
  end

  # Dans app/controllers/epci_dashboard_controller.rb
  def prepare_schooling_geojson_data
    # Préparer le GeoJSON pour les taux de scolarisation des enfants de 2 ans
    features_schooling = []

    @epci_schooling_communes_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le taux de scolarisation des enfants de 2 ans
      schooling_rate_2y = commune["schooling_rate_2y"].to_f

      # Créer un feature GeoJSON avec les propriétés
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          schooling_rate_2y: schooling_rate_2y,
          total_children_2y: commune["total_children_2y"].round(1),
          schooled_children_2y: commune["schooled_children_2y"].round(1),
          schooling_rate_3_5y: commune["schooling_rate_3_5y"].to_f,
          total_children_3_5y: commune["total_children_3_5y"].round(1),
          schooled_children_3_5y: commune["schooled_children_3_5y"].round(1)
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_schooling << feature
    end

    @communes_schooling_geojson = {
      type: "FeatureCollection",
      features: features_schooling
    }.to_json
  end

  def prepare_childcare_geojson_data
    # Préparer le GeoJSON pour la couverture petite enfance par commune
    features_childcare = []

    @epci_childcare_communes_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le taux de couverture global
      global_coverage_rate = commune["global_coverage_rate"].to_f

      # Créer un feature GeoJSON avec les propriétés
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          global_coverage_rate: global_coverage_rate,
          year: @epci_childcare_communes_data["year"]
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_childcare << feature
    end

    @communes_childcare_geojson = {
      type: "FeatureCollection",
      features: features_childcare
    }.to_json
  end
end
