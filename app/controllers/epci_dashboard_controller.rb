class EpciDashboardController < ApplicationController
  include UserAuthorization
  include TerritoryNamesHelper

  before_action :check_epci_user
  before_action :set_epci_variables

  def index
    # ⏱️ Mesurer le temps de chargement en développement
    start_time = Time.current if Rails.env.development?

    # ✅ Charger les données essentielles (communes + France) - RAPIDE avec cache
    load_essential_data

    # ✅ Charger TOUTES les sections avec le cache - BEAUCOUP plus rapide !
    load_all_sections_data

    # ✅ Préparer les données géographiques si disponibles
    prepare_geographic_data if @epci_communes_data.present?

    # 📊 Log du temps de chargement en développement
    if Rails.env.development? && start_time
      total_time = ((Time.current - start_time) * 1000).round(2)
      cache_info = EpciCacheService.cache_info(@epci_code)
      Rails.logger.info "🚀 EPCI Dashboard chargé en #{total_time}ms - Cache info: #{cache_info}"
    end
  end

  # 🗑️ Vider le cache de l'EPCI (utile en développement)
  def clear_cache
    EpciCacheService.invalidate_epci_cache(@epci_code)
    redirect_to epci_dashboard_path, notice: "Cache EPCI vidé avec succès"
  end

  # 🗑️ Vider le cache France (admin seulement)
  def clear_france_cache
    # Sécurité : seulement pour les super admins
    unless current_user.super_admin?
      redirect_to epci_dashboard_path, alert: "Accès non autorisé"
      return
    end

    EpciCacheService.invalidate_france_cache
    redirect_to epci_dashboard_path, notice: "Cache France vidé avec succès"
  end

  # 📊 Voir les informations de cache
  def cache_info
    info = EpciCacheService.cache_info(@epci_code)
    render json: info
  end

  private

  # 🔧 Initialiser les variables EPCI
  def set_epci_variables
    @epci_code = current_user.territory_code
    @epci_name = current_user.territory_name

    # Récupérer les codes département et région principal avec la LOGIQUE ORIGINALE
    @main_department_code = get_main_department_code(@epci_code)
    @main_region_code = get_main_region_code(@epci_code)

    # 🔧 AJOUT CRUCIAL : Assigner les variables que le helper territory_names_helper.rb attend
    @department_code = @main_department_code
    @region_code = @main_region_code
  end

  def check_epci_user
    unless current_user.territory_type == 'epci' && current_user.territory_code.present?
      redirect_to root_path, alert: "Ce dashboard est réservé aux utilisateurs EPCI."
    end
  end

  # ✅ LOGIQUE ORIGINALE RESTAURÉE : Utiliser les relations Epci et colonnes 'dep'/'reg'
  def get_main_department_code(epci_code)
    return nil if epci_code.blank?

    begin
      # ✅ LOGIQUE ORIGINALE : Utiliser les relations Epci et la colonne 'dep'
      epci_object = Epci.find_by(epci: epci_code)
      return nil unless epci_object && epci_object.territories.any?

      # Trouver le département le plus représenté dans l'EPCI
      department_counts = epci_object.territories.group(:dep).count
      main_department_code = department_counts.max_by { |_, count| count }&.first

      Rails.logger.info "🏛️ Département principal pour EPCI #{epci_code}: #{main_department_code}"
      return main_department_code

    rescue => e
      Rails.logger.warn "Erreur récupération département pour EPCI #{epci_code}: #{e.message}"
      return nil
    end
  end

  def get_main_region_code(epci_code)
    return nil if epci_code.blank?

    begin
      # ✅ LOGIQUE ORIGINALE : Utiliser les relations Epci et la colonne 'reg'
      epci_object = Epci.find_by(epci: epci_code)
      return nil unless epci_object && epci_object.territories.any?

      # Récupérer le département principal
      main_department_code = get_main_department_code(epci_code)
      return nil if main_department_code.blank?

      # Trouver la région associée à ce département
      main_region_code = epci_object.territories.where(dep: main_department_code).first&.reg

      Rails.logger.info "🗺️ Région pour département #{main_department_code}: #{main_region_code}"
      return main_region_code

    rescue => e
      Rails.logger.warn "Erreur récupération région pour EPCI #{epci_code}: #{e.message}"
      return nil
    end
  end

  def load_essential_data
    # ✅ Utilise le cache pour les données essentielles
    @epci_communes_data = EpciCacheService.epci_essential_data(@epci_code)

    # ✅ Données France (cache longue durée)
    load_france_data_with_cache
  end

  def load_france_data_with_cache
    # ✅ Toutes les données France en cache
    @france_children_data = EpciCacheService.france_children_data
    @france_revenue_data = EpciCacheService.france_revenue_data
    @france_family_data = EpciCacheService.france_family_data
    @france_schooling_data = EpciCacheService.france_schooling_data
    @france_childcare_data = EpciCacheService.france_childcare_data
    @france_family_employment_under3_data = EpciCacheService.france_family_employment_under3_data
    @france_family_employment_3to5_data = EpciCacheService.france_family_employment_3to5_data
    @france_employment_data = EpciCacheService.france_employment_data
  end

  # ✅ Nouvelles méthodes avec cache pour charger toutes les sections
  def load_all_sections_data
    # Charger toutes les données en parallèle avec le cache
    load_families_data_with_cache
    load_births_data_with_cache
    load_children_data_with_cache
    load_schooling_data_with_cache
    load_economic_data_with_cache
    load_childcare_data_with_cache
    load_family_employment_data_with_cache
    load_women_employment_data_with_cache
    load_domestic_violence_data_with_cache
  end

  def load_families_data_with_cache
    # ✅ Données EPCI families (cache)
    families_data = EpciCacheService.epci_families_data(@epci_code)

    # ✅ Données département et région (cache) - avec gestion d'erreur
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    # 🔧 CORRECTION : Assigner les variables individuelles pour compatibilité avec les templates
    @epci_family_data = families_data[:family_data] || {}
    @epci_families_data = families_data[:families_data] || {}
    @epci_single_parent_data = families_data[:single_parent_data] || {}
    @epci_large_families_data = families_data[:large_families_data] || {}

    # Variables département/région
    @department_family_data = department_data[:family_data] || {}
    @region_family_data = region_data[:family_data] || {}

    # 🔧 AJOUT CRUCIAL : Assigner les données pour les noms de territoires
    @department_children_data = department_data[:children_data] || {}
    @department_revenue_data = department_data[:revenue_data] || {}
    @region_children_data = region_data[:children_data] || {}
    @region_revenue_data = region_data[:revenue_data] || {}

    # Variables pour sections
    @epci_families_section_data = families_data.merge({
      department_family_data: @department_family_data,
      region_family_data: @region_family_data
    })

    # Préparer le GeoJSON (garde les méthodes existantes)
    prepare_families_geojson_data if @epci_families_data.present?
    prepare_single_parent_geojson_data if @epci_single_parent_data.present?
    prepare_large_families_geojson_data if @epci_large_families_data.present?
  end

  def load_births_data_with_cache
    @epci_births_data = EpciCacheService.epci_births_data(@epci_code) || {}
    @epci_births_section_data = { births_data: @epci_births_data }
    prepare_births_geojson_data if @epci_births_data.present?
  end

  def load_children_data_with_cache
    # ✅ Données EPCI children (cache)
    children_data = EpciCacheService.epci_children_data(@epci_code)

    # ✅ Données département et région (cache) - avec gestion d'erreur
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    # 🔧 CORRECTION : Assigner les variables individuelles pour compatibilité
    @epci_children_data = children_data[:children_data] || {}
    @epci_population_data = children_data[:population_data] || {}
    @epci_historical_data = children_data[:historical_data] || {}

    # Variables département/région
    @department_children_data = department_data[:children_data] || {}
    @region_children_data = region_data[:children_data] || {}

    @epci_children_section_data = children_data.merge({
      department_children_data: @department_children_data,
      region_children_data: @region_children_data
    })

    # Préparer la pyramide des âges
    @epci_age_pyramid_data = prepare_epci_age_pyramid_data(@epci_population_data)
    @epci_children_section_data[:age_pyramid_data] = @epci_age_pyramid_data
  end

  def load_schooling_data_with_cache
    # ✅ Données EPCI schooling (cache)
    schooling_data = EpciCacheService.epci_schooling_data(@epci_code)

    # ✅ Données département et région (cache) - avec gestion d'erreur
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    # 🔧 CORRECTION : Assigner les variables individuelles
    @epci_schooling_data = schooling_data[:schooling_data] || {}
    @epci_schooling_communes_data = schooling_data[:schooling_communes_data] || {}

    @department_schooling_data = department_data[:schooling_data] || {}
    @region_schooling_data = region_data[:schooling_data] || {}

    @epci_schooling_section_data = schooling_data.merge({
      department_schooling_data: @department_schooling_data,
      region_schooling_data: @region_schooling_data
    })

    prepare_schooling_geojson_data if @epci_schooling_communes_data.present?
  end

  def load_economic_data_with_cache
    # ✅ Données EPCI economic (cache)
    economic_data = EpciCacheService.epci_economic_data(@epci_code)

    # ✅ Données département et région (cache) - avec gestion d'erreur
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    # 🔧 CORRECTION : Assigner les variables individuelles
    @epci_revenues_data = economic_data[:revenues_data] || {}
    @epci_revenue_data = economic_data[:revenue_data] || {}

    @department_revenue_data = department_data[:revenue_data] || {}
    @region_revenue_data = region_data[:revenue_data] || {}

    @epci_economic_section_data = economic_data.merge({
      department_revenue_data: @department_revenue_data,
      region_revenue_data: @region_revenue_data
    })

    prepare_revenues_geojson_data if @epci_revenues_data.present?
  end

  def load_childcare_data_with_cache
    # ✅ Données EPCI childcare (cache)
    childcare_data = EpciCacheService.epci_childcare_data(@epci_code)

    # ✅ Données département et région (cache) - avec gestion d'erreur
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    # 🔧 CORRECTION : Assigner les variables individuelles
    @epci_childcare_data = childcare_data[:childcare_data] || {}
    @epci_childcare_communes_data = childcare_data[:childcare_communes_data] || {}

    @department_childcare_data = department_data[:childcare_data] || {}
    @region_childcare_data = region_data[:childcare_data] || {}

    @epci_childcare_section_data = childcare_data.merge({
      department_childcare_data: @department_childcare_data,
      region_childcare_data: @region_childcare_data
    })

    prepare_childcare_geojson_data if @epci_childcare_communes_data.present?
  end

  def load_family_employment_data_with_cache
    # ✅ Données EPCI family employment (cache)
    family_employment_data = EpciCacheService.epci_family_employment_data(@epci_code)

    # ✅ Données département et région (cache) - avec gestion d'erreur
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    # 🔧 CORRECTION : Assigner les variables individuelles AVEC LES BONS NOMS
    @epci_family_employment_under3_data = family_employment_data[:family_employment_under3_data] || {}
    @epci_family_employment_3to5_data = family_employment_data[:family_employment_3to5_data] || {}

    # 🔧 AJOUT : Variables département/région que le template attend
    @department_family_employment_under3_data = department_data[:family_employment_under3_data] || {}
    @department_family_employment_3to5_data = department_data[:family_employment_3to5_data] || {}
    @region_family_employment_under3_data = region_data[:family_employment_under3_data] || {}
    @region_family_employment_3to5_data = region_data[:family_employment_3to5_data] || {}

    @epci_family_employment_section_data = family_employment_data.merge({
      department_family_employment_under3_data: @department_family_employment_under3_data,
      department_family_employment_3to5_data: @department_family_employment_3to5_data,
      region_family_employment_under3_data: @region_family_employment_under3_data,
      region_family_employment_3to5_data: @region_family_employment_3to5_data
    })
  end

  def load_women_employment_data_with_cache
    @epci_women_employment_data = EpciCacheService.epci_women_employment_data(@epci_code) || {}

    # ✅ Données département et région (cache) - avec gestion d'erreur
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    # 🔧 CORRECTION : Assigner les variables département/région que le template attend
    @department_employment_data = department_data[:employment_data] || {}
    @region_employment_data = region_data[:employment_data] || {}

    # ✅ Variable pour la section complète
    @epci_women_employment_section_data = {
      women_employment_data: @epci_women_employment_data
    }

    @epci_women_employment_section_data.merge!({
      department_employment_data: @department_employment_data,
      region_employment_data: @region_employment_data
    })

    prepare_women_employment_geojson_data if @epci_women_employment_data.present?
  end

  def load_domestic_violence_data_with_cache
    @epci_domestic_violence_data = EpciCacheService.epci_domestic_violence_data(@epci_code) || {}

    # ✅ Données département et région (cache) - avec gestion d'erreur COMPLÈTE
    department_data = {}
    region_data = {}

    if @main_department_code.present?
      begin
        department_data = EpciCacheService.department_data(@main_department_code) || {}
      rescue => e
        Rails.logger.warn "Erreur chargement données département #{@main_department_code}: #{e.message}"
      end
    end

    if @main_region_code.present?
      begin
        region_data = EpciCacheService.region_data(@main_region_code) || {}
      rescue => e
        Rails.logger.warn "Erreur chargement données région #{@main_region_code}: #{e.message}"
      end
    end

    # 🔧 CORRECTION : Assigner les variables individuelles avec protection nil COMPLÈTE
    @department_domestic_violence_data = department_data.dig(:domestic_violence_data) || {}
    @region_domestic_violence_data = region_data.dig(:domestic_violence_data) || {}

    @epci_domestic_violence_section_data = {
      domestic_violence_data: @epci_domestic_violence_data
    }

    @epci_domestic_violence_section_data.merge!({
      department_domestic_violence_data: @department_domestic_violence_data,
      region_domestic_violence_data: @region_domestic_violence_data
    })

    prepare_domestic_violence_geojson_data if @epci_domestic_violence_data.present?
  end

  def prepare_geographic_data
    prepare_geojson_data
    prepare_communes_chart_data
  end

  def prepare_communes_chart_data
    return unless @epci_communes_data.present? && @epci_communes_data["communes"].present?

    communes = @epci_communes_data["communes"].sort_by { |c| -(c["under_3_rate"] || 0) }

    @communes_under3_data = {
      commune_names: communes.map { |c| c["name"] },
      under3_rates: communes.map { |c| c["under_3_rate"] || 0 },
      children_under3_counts: communes.map { |c| (c["children_under_3"] || 0).round },
      commune_codes: communes.map { |c| c["code"] },
      commune_populations: communes.map { |c| (c["total_population"] || 0).round }
    }
  end

  def prepare_geojson_data
    return unless @epci_communes_data.present? && @epci_communes_data["communes"].present?

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
          under3_rate: commune["under_3_rate"] || 0,
          children_under3: (commune["children_under_3"] || 0).round,
          population: (commune["total_population"] || 0).round
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
          rate_3to5: commune["three_to_five_rate"] || 0,
          children_3to5: (commune["children_3_to_5"] || 0).round,
          population: (commune["total_population"] || 0).round
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
    return unless @epci_births_data.present? && @epci_births_data["communes"].present?

    # Préparer le GeoJSON pour les naissances par commune
    features_births = []

    # Récupérer l'année la plus récente
    latest_year = @epci_births_data["years_available"]&.max&.to_s || "2021"

    @epci_births_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le nombre de naissances pour la dernière année disponible
      births_count = commune.dig("births_by_year", latest_year).to_f

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
    return unless @epci_revenues_data.present? && @epci_revenues_data["communes"].present?

    # Préparer le GeoJSON pour les revenus médians par commune
    features_revenues = []

    # Récupérer l'année la plus récente
    latest_year = @epci_revenues_data["latest_year"]&.to_s || "2021"

    @epci_revenues_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le revenu médian et taux de pauvreté pour la dernière année disponible
      median_revenue = commune.dig("median_revenues", latest_year).to_f
      poverty_rate = commune.dig("poverty_rates", latest_year)

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
    return unless @epci_families_data.present? && @epci_families_data["communes"].present?

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
          couples_count: (commune["couples_with_children"] || 0).round,
          total_households: (commune["total_households"] || 0).round,
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
    return unless @epci_single_parent_data.present? && @epci_single_parent_data["communes"].present?

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
          single_parent_count: (commune["single_parent_families"] || 0).round,
          single_fathers_percentage: commune["single_father_percentage"].to_f,
          single_mothers_percentage: commune["single_mother_percentage"].to_f,
          total_households: (commune["total_households"] || 0).round,
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
    return unless @epci_large_families_data.present? && @epci_large_families_data["communes"].present?

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
          large_families_count: (commune["large_families"] || 0).round,
          families_3_children_percentage: commune["families_3_children_percentage"].to_f,
          families_4_plus_percentage: commune["families_4_plus_percentage"].to_f,
          total_households: (commune["total_households"] || 0).round,
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

  def prepare_schooling_geojson_data
    return unless @epci_schooling_communes_data.present? && @epci_schooling_communes_data["communes"].present?

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
          total_children_2y: (commune["total_children_2y"] || 0).round(1),
          schooled_children_2y: (commune["schooled_children_2y"] || 0).round(1),
          schooling_rate_3_5y: commune["schooling_rate_3_5y"].to_f,
          total_children_3_5y: (commune["total_children_3_5y"] || 0).round(1),
          schooled_children_3_5y: (commune["schooled_children_3_5y"] || 0).round(1)
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
    return unless @epci_childcare_communes_data.present? && @epci_childcare_communes_data["communes"].present?

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

  def prepare_women_employment_geojson_data
    return unless @epci_women_employment_data.present? && @epci_women_employment_data["communes"].present?

    # Préparer le GeoJSON pour le taux d'activité des femmes par commune
    features_women_employment = []

    @epci_women_employment_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le taux d'activité des femmes
      activity_rate = commune["activity_rate"].to_f

      # Créer un feature GeoJSON avec les propriétés
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          activity_rate: activity_rate,
          employment_rate: commune["employment_rate"].to_f,
          part_time_rate_15_64: commune["part_time_rate_15_64"].to_f,
          women_15_64: (commune["women_15_64"] || 0).round,
          women_active_15_64: (commune["women_active_15_64"] || 0).round
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_women_employment << feature
    end

    @communes_women_employment_geojson = {
      type: "FeatureCollection",
      features: features_women_employment
    }.to_json
  end

  def extract_domestic_violence_data(data)
    result = {}

    if data.present? && data["data"].present?
      violence_data = data["data"].select { |item| item["indicator_class"] == "Coups et blessures volontaires intrafamiliaux" }

      violence_data.each do |item|
        year = "20#{item["year"]}" # Convertir 16 en "2016"
        result[year] = item["rate"]
      end
    end

    result
  end

  helper_method :extract_domestic_violence_data

  def prepare_domestic_violence_geojson_data
    return unless @epci_domestic_violence_data.present? && @epci_domestic_violence_data["communes"].present?

    # Préparer le GeoJSON pour les taux de violences intrafamiliales par commune
    features_domestic_violence = []

    # Identifier l'année la plus récente disponible
    latest_available_years = @epci_domestic_violence_data["communes"].map do |commune|
      commune["yearly_data"]&.map { |data| data["year"] } || []
    end.flatten.uniq.sort

    latest_year = latest_available_years.last
    short_year = latest_year.to_i
    full_year = "20#{short_year}"

    @epci_domestic_violence_data["communes"].each do |commune|
      # Récupérer la géométrie depuis la base de données
      geometry = CommuneGeometry.find_by(code_insee: commune["code"])
      next unless geometry&.geojson.present?

      # Récupérer le taux de violences intrafamiliales pour l'année la plus récente
      latest_data = commune["yearly_data"]&.find { |d| d["year"] == short_year }
      violence_rate = latest_data ? latest_data["rate"] : nil

      # Créer un feature GeoJSON avec les propriétés
      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          violence_rate: violence_rate,
          average_rate: commune["average_rate"],
          latest_year: full_year,
          population: (commune["population"] || 0).to_i
        },
        geometry: JSON.parse(geometry.geojson)
      }

      features_domestic_violence << feature
    end

    @communes_domestic_violence_geojson = {
      type: "FeatureCollection",
      features: features_domestic_violence
    }.to_json

    # Stocker l'année la plus récente pour l'affichage
    @epci_latest_violence_year = full_year
  end
end
