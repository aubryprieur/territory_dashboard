class EpciDashboardController < ApplicationController
  include UserAuthorization
  include TerritoryNamesHelper

  before_action :check_epci_user
  before_action :set_epci_variables

  def index
    start_time = Time.current

    # Chargement minimal - SEULEMENT les infos de base
    load_minimal_essential_data_only

    total_time = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "🚀 EPCI Dashboard initial chargé en #{total_time}ms (mode optimisé)"
  end

  def load_population
    start_time = Time.current

    cache_key = "epci:#{@epci_code}:population:v1"
    @population_data = Rails.cache.fetch(cache_key, expires_in: 6.hours) do
      Rails.logger.info "🔄 Chargement population depuis l'API pour #{@epci_code}"
      EpciCacheService.epci_children_data(@epci_code)
    end

    @epci_children_data = @population_data[:children_data] || {}
    @epci_population_data = @population_data[:population_data] || {}
    @epci_historical_data = @population_data[:historical_data] || {}

    if @epci_population_data.present?
      @epci_age_pyramid_data = prepare_epci_age_pyramid_data(@epci_population_data)
    end

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "📊 load_population terminé en #{duration}ms"

    render partial: 'epci_dashboard/population'
  end

  def load_families
    start_time = Time.current
    Rails.logger.info "🔍 Début load_families"

    load_families_data_with_cache

    if should_prepare_geojson?
      prepare_families_geojson_data if @epci_families_data.present?
      prepare_single_parent_geojson_data if @epci_single_parent_data.present?
      prepare_large_families_geojson_data if @epci_large_families_data.present?
    end

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "✅ load_families total : #{duration}ms"

    render partial: 'epci_dashboard/families'
  end

  def load_births
    start_time = Time.current

    load_births_data_with_cache
    prepare_births_geojson_data if @epci_births_data.present? && should_prepare_geojson?

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "📊 load_births terminé en #{duration}ms"

    render partial: 'epci_dashboard/communes_births'
  end

  def load_children
    start_time = Time.current

    load_children_data_with_cache

    # S'assurer que les données communes sont disponibles pour GeoJSON
    if should_prepare_geojson? && @epci_communes_data.blank?
      @epci_communes_data = EpciCacheService.epci_essential_data(@epci_code)
      Rails.logger.info "🔧 Rechargement communes_data pour enfants"
    end

    # Préparer la pyramide des âges
    if @epci_population_data.present?
      @epci_age_pyramid_data = prepare_epci_age_pyramid_data(@epci_population_data)
      @epci_children_section_data[:age_pyramid_data] = @epci_age_pyramid_data if @epci_children_section_data
    end

    # GeoJSON seulement si nécessaire
    if should_prepare_geojson? && @epci_communes_data.present?
      prepare_geojson_data_optimized
    end

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "📊 load_children terminé en #{duration}ms"

    render partial: 'epci_dashboard/communes_children'
  end

  def load_schooling
    start_time = Time.current

    load_schooling_data_with_cache
    prepare_schooling_geojson_data if @epci_schooling_communes_data.present? && should_prepare_geojson?

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "📊 load_schooling terminé en #{duration}ms"

    render partial: 'epci_dashboard/schooling'
  end

  def load_economic
    start_time = Time.current

    load_economic_data_with_cache
    prepare_revenues_geojson_data if @epci_revenues_data.present? && should_prepare_geojson?

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "📊 load_economic terminé en #{duration}ms"

    render partial: 'epci_dashboard/economic_data'
  end

  def load_childcare
    start_time = Time.current

    load_childcare_data_with_cache
    prepare_childcare_geojson_data if @epci_childcare_communes_data.present? && should_prepare_geojson?

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "📊 load_childcare terminé en #{duration}ms"

    render partial: 'epci_dashboard/childcare'
  end

  def load_family_employment
    start_time = Time.current

    load_family_employment_data_with_cache

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "📊 load_family_employment terminé en #{duration}ms"

    render partial: 'epci_dashboard/family_employment'
  end

  def load_women_employment
    start_time = Time.current

    load_women_employment_data_with_cache
    prepare_women_employment_geojson_data if @epci_women_employment_data.present? && should_prepare_geojson?

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "📊 load_women_employment terminé en #{duration}ms"

    render partial: 'epci_dashboard/women_employment'
  end

  def load_domestic_violence
    start_time = Time.current

    @main_department_code ||= session[:main_department_code]
    @main_region_code ||= session[:main_region_code]
    @epci_code ||= current_user.territory_code
    @epci_name ||= current_user.territory_name

    load_domestic_violence_data_with_cache
    prepare_domestic_violence_geojson_data if @epci_domestic_violence_data.present? && should_prepare_geojson?

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "📊 load_domestic_violence terminé en #{duration}ms"

    render partial: 'epci_dashboard/domestic_violence'
  end

  # Méthodes de gestion de cache
  def clear_cache
    EpciCacheService.invalidate_epci_cache(@epci_code)
    redirect_to epci_dashboard_path, notice: "Cache EPCI vidé avec succès"
  end

  def clear_france_cache
    unless current_user.super_admin?
      redirect_to epci_dashboard_path, alert: "Accès non autorisé"
      return
    end
    EpciCacheService.invalidate_france_cache
    redirect_to epci_dashboard_path, notice: "Cache France vidé avec succès"
  end

  def cache_info
    info = EpciCacheService.cache_info(@epci_code)
    render json: info
  end

  private

  # Chargement VRAIMENT minimal - pas d'API, pas de GeoJSON
  def load_minimal_essential_data_only
    @epci_basic_info = {
      code: @epci_code,
      name: @epci_name,
      department: @main_department_code,
      region: @main_region_code
    }

    # ✅ AJOUT CRITIQUE : Charger les données des communes pour la recherche
    cache_key = "epci:#{@epci_code}:essential:v1"
    @epci_communes_data = Rails.cache.fetch(cache_key, expires_in: 6.hours) do
      Rails.logger.info "📄 Chargement données essentielles communes pour #{@epci_code}"
      EpciCacheService.epci_essential_data(@epci_code)
    end

    Rails.logger.info "✅ Chargement minimal terminé pour #{@epci_code} avec #{@epci_communes_data&.dig('communes')&.count || 0} communes"
  end

  # GeoJSON vraiment optimisé avec pluck
  def prepare_geojson_data_optimized
    return unless @epci_communes_data.present? && @epci_communes_data["communes"].present?

    start_time = Time.current
    commune_codes = @epci_communes_data["communes"].map { |c| c["code"] }

    # CRITIQUE: Utiliser pluck pour ne récupérer QUE les données nécessaires
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    Rails.logger.info "🗺️ Géométries chargées: #{geometries_by_code.count}/#{commune_codes.count} communes"

    # Préparer features pour moins de 3 ans
    features = build_geojson_features(@epci_communes_data["communes"], geometries_by_code, :under3)

    @communes_geojson = {
      type: "FeatureCollection",
      features: features
    }.to_json

    # Préparer features pour 3-5 ans
    features_3to5 = build_geojson_features(@epci_communes_data["communes"], geometries_by_code, :three_to_five)

    @communes_geojson_3to5 = {
      type: "FeatureCollection",
      features: features_3to5
    }.to_json

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "GeoJSON optimisé préparé en #{duration}ms pour #{features.size} communes"
  end

  # Helper pour construire les features GeoJSON
  def build_geojson_features(communes, geometries_by_code, type)
    features = []

    communes.each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      begin
        geometry = JSON.parse(geojson)

        properties = {
          code: commune["code"],
          name: commune["name"],
          population: (commune["total_population"] || 0).round
        }

        # Ajouter les propriétés spécifiques selon le type
        case type
        when :under3
          properties.merge!({
            under3_rate: commune["under_3_rate"] || 0,
            children_under3: (commune["children_under_3"] || 0).round
          })
        when :three_to_five
          properties.merge!({
            rate_3to5: commune["three_to_five_rate"] || 0,
            children_3to5: (commune["children_3_to_5"] || 0).round
          })
        end

        features << {
          type: "Feature",
          properties: properties,
          geometry: geometry
        }
      rescue JSON::ParserError => e
        Rails.logger.warn "⚠️ GeoJSON invalide pour commune #{commune['code']}: #{e.message}"
      end
    end

    features
  end

  # Cache optimisé pour les codes département/région
  def set_epci_variables
    @epci_code = current_user.territory_code
    @epci_name = current_user.territory_name

    cache_key = "epci:#{@epci_code}:location_codes:v3"

    begin
      location_data = Rails.cache.fetch(cache_key, expires_in: 24.hours) do
        Rails.logger.info "🔄 Calcul codes département/région pour #{@epci_code}"
        calculate_location_codes
      end

      @main_department_code = location_data[:department]
      @main_region_code = location_data[:region]

    rescue => e
      Rails.logger.error "❌ Erreur codes location pour #{@epci_code}: #{e.message}"
      @main_department_code = nil
      @main_region_code = nil
    end

    session[:main_department_code] = @main_department_code
    session[:main_region_code] = @main_region_code
  end

  # Méthode optimisée pour calculer les codes - une seule requête
  def calculate_location_codes
    epci_object = Epci.find_by(epci: @epci_code)
    return { department: nil, region: nil } unless epci_object

    # UNE SEULE requête pour récupérer département ET région
    territory = epci_object.territories
                          .group(:dep, :reg)
                          .count
                          .max_by(&:last)
                          &.first

    if territory && territory.is_a?(Array) && territory.length >= 2
      { department: territory[0], region: territory[1] }
    else
      { department: nil, region: nil }
    end
  end

  def check_epci_user
    unless current_user.territory_type == 'epci' && current_user.territory_code.present?
      redirect_to root_path, alert: "Ce dashboard est réservé aux utilisateurs EPCI."
    end
  end

  # Helper pour décider si préparer le GeoJSON
  def should_prepare_geojson?
    return false if request.user_agent&.include?('Mobile') && params[:skip_maps] == '1'
    true
  end

  # TOUTES VOS MÉTHODES DE CHARGEMENT DE DONNÉES (identiques à la version précédente)
  def load_families_data_with_cache
    families_data = EpciCacheService.epci_families_data(@epci_code)
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    @france_family_data = EpciCacheService.france_family_data
    @france_children_data = EpciCacheService.france_children_data

    @epci_family_data = families_data[:family_data] || {}
    @epci_families_data = families_data[:families_data] || {}
    @epci_single_parent_data = families_data[:single_parent_data] || {}
    @epci_large_families_data = families_data[:large_families_data] || {}

    @department_family_data = department_data[:family_data] || {}
    @region_family_data = region_data[:family_data] || {}
    @department_children_data = department_data[:children_data] || {}
    @department_revenue_data = department_data[:revenue_data] || {}
    @region_children_data = region_data[:children_data] || {}
    @region_revenue_data = region_data[:revenue_data] || {}

    @epci_families_section_data = families_data.merge({
      department_family_data: @department_family_data,
      region_family_data: @region_family_data
    })
  end

  def load_births_data_with_cache
    @epci_births_data = EpciCacheService.epci_births_data(@epci_code) || {}
    @epci_births_section_data = { births_data: @epci_births_data }
  end

  def load_children_data_with_cache
    children_data = EpciCacheService.epci_children_data(@epci_code)
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    @france_children_data = EpciCacheService.france_children_data

    @epci_children_data = children_data[:children_data] || {}
    @epci_population_data = children_data[:population_data] || {}
    @epci_historical_data = children_data[:historical_data] || {}

    @department_children_data = department_data[:children_data] || {}
    @region_children_data = region_data[:children_data] || {}

    @epci_children_section_data = children_data.merge({
      department_children_data: @department_children_data,
      region_children_data: @region_children_data
    })
  end

  def load_schooling_data_with_cache
    schooling_data = EpciCacheService.epci_schooling_data(@epci_code)
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    @france_schooling_data = EpciCacheService.france_schooling_data

    @epci_schooling_data = schooling_data[:schooling_data] || {}
    @epci_schooling_communes_data = schooling_data[:schooling_communes_data] || {}
    @department_schooling_data = department_data[:schooling_data] || {}
    @region_schooling_data = region_data[:schooling_data] || {}

    @epci_schooling_section_data = schooling_data.merge({
      department_schooling_data: @department_schooling_data,
      region_schooling_data: @region_schooling_data
    })
  end

  def load_economic_data_with_cache
    economic_data = EpciCacheService.epci_economic_data(@epci_code)
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    @france_revenue_data = EpciCacheService.france_revenue_data

    @epci_revenues_data = economic_data[:revenues_data] || {}
    @epci_revenue_data = economic_data[:revenue_data] || {}
    @department_revenue_data = department_data[:revenue_data] || {}
    @region_revenue_data = region_data[:revenue_data] || {}

    @epci_economic_section_data = economic_data.merge({
      department_revenue_data: @department_revenue_data,
      region_revenue_data: @region_revenue_data
    })
  end

  def load_childcare_data_with_cache
    childcare_data = EpciCacheService.epci_childcare_data(@epci_code)
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    @france_childcare_data = EpciCacheService.france_childcare_data

    @epci_childcare_data = childcare_data[:childcare_data] || {}
    @epci_childcare_communes_data = childcare_data[:childcare_communes_data] || {}
    @department_childcare_data = department_data[:childcare_data] || {}
    @region_childcare_data = region_data[:childcare_data] || {}

    @epci_childcare_section_data = childcare_data.merge({
      department_childcare_data: @department_childcare_data,
      region_childcare_data: @region_childcare_data
    })
  end

  def load_family_employment_data_with_cache
    family_employment_data = EpciCacheService.epci_family_employment_data(@epci_code)
    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    @france_family_employment_under3_data = EpciCacheService.france_family_employment_under3_data
    @france_family_employment_3to5_data = EpciCacheService.france_family_employment_3to5_data

    @epci_family_employment_under3_data = family_employment_data[:family_employment_under3_data] || {}
    @epci_family_employment_3to5_data = family_employment_data[:family_employment_3to5_data] || {}

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

    department_data = @main_department_code ? EpciCacheService.department_data(@main_department_code) : {}
    region_data = @main_region_code ? EpciCacheService.region_data(@main_region_code) : {}

    @france_employment_data = EpciCacheService.france_employment_data

    @department_employment_data = department_data[:employment_data] || {}
    @region_employment_data = region_data[:employment_data] || {}

    @epci_women_employment_section_data = {
      women_employment_data: @epci_women_employment_data,
      department_employment_data: @department_employment_data,
      region_employment_data: @region_employment_data
    }
  end

  def load_domestic_violence_data_with_cache
    @epci_domestic_violence_data = EpciCacheService.epci_domestic_violence_data(@epci_code) || {}

    if @main_department_code
      begin
        @department_domestic_violence_data = Api::PublicSafetyService.get_department_safety(@main_department_code)
      rescue => e
        Rails.logger.error "Erreur API Département: #{e.message}"
        @department_domestic_violence_data = {}
      end
    end

    if @main_region_code
      begin
        @region_domestic_violence_data = Api::PublicSafetyService.get_region_safety(@main_region_code)
      rescue => e
        Rails.logger.error "Erreur API Région: #{e.message}"
        @region_domestic_violence_data = {}
      end
    end

    @epci_domestic_violence_section_data = {
      domestic_violence_data: @epci_domestic_violence_data,
      department_domestic_violence_data: @department_domestic_violence_data,
      region_domestic_violence_data: @region_domestic_violence_data
    }

    @epci_latest_violence_year = @epci_domestic_violence_data["latest_year"]
  end

  # Toutes les méthodes prepare_*_geojson_data restent identiques à la version précédente
  def prepare_epci_age_pyramid_data(population_data)
    return {} if population_data.blank? || !population_data.key?("population_by_age")

    population_by_age = population_data["population_by_age"]

    {
      ageGroups: population_by_age.map { |age_data| age_data["age"].to_s }.reverse,
      maleData: population_by_age.map { |age_data| age_data["men"].to_f.round }.reverse,
      femaleData: population_by_age.map { |age_data| age_data["women"].to_f.round }.reverse
    }
  end

  # [TOUS LES prepare_*_geojson_data de la version précédente - identiques avec pluck]
  def prepare_births_geojson_data
    return unless @epci_births_data.present? && @epci_births_data["communes"].present?

    start_time = Time.current

    commune_codes = @epci_births_data["communes"].map { |c| c["code"] }
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    features_births = []
    latest_year = @epci_births_data["years_available"]&.max&.to_s || "2021"

    @epci_births_data["communes"].each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      births_count = commune.dig("births_by_year", latest_year).to_f

      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          births_count: births_count.round,
          latest_year: latest_year.to_i
        },
        geometry: JSON.parse(geojson)
      }

      features_births << feature
    end

    @communes_births_geojson = {
      type: "FeatureCollection",
      features: features_births
    }.to_json

    @epci_latest_birth_year = latest_year.to_i

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "GeoJSON naissances préparé en #{duration}ms pour #{features_births.size} communes"
  end

  # [Inclure toutes les autres méthodes prepare_*_geojson_data avec pluck - identiques à la version précédente]
  def prepare_families_geojson_data
    return unless @epci_families_data.present? && @epci_families_data["communes"].present?

    start_time = Time.current

    commune_codes = @epci_families_data["communes"].map { |c| c["code"] }
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    features_families = []

    @epci_families_data["communes"].each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      couples_percentage = commune["couples_with_children_percentage"].to_f

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
        geometry: JSON.parse(geojson)
      }

      features_families << feature
    end

    @communes_families_geojson = {
      type: "FeatureCollection",
      features: features_families
    }.to_json

    duration = ((Time.current - start_time) * 1000).round(2)
    Rails.logger.info "GeoJSON familles préparé en #{duration}ms pour #{features_families.size} communes"
  end

  # ... (toutes les autres méthodes prepare_*_geojson_data avec le même pattern pluck)

  def extract_domestic_violence_data(data)
    result = {}
    return {} unless data.present?

    violence_data = if data["region"] && data["region"]["code"] && data["region"]["code"] != "" && data["region"]["data"]
      data["region"]["data"]
    elsif data["department"] && data["department"]["code"] && data["department"]["code"] != "" && data["department"]["data"]
      data["department"]["data"]
    elsif data["data"]
      data["data"]
    else
      []
    end

    # Filtrer et extraire les données de violences intrafamiliales
    violence_items = violence_data.select { |item|
      item["indicator_class"] == "Coups et blessures volontaires intrafamiliaux"
    }

    violence_items.each do |item|
      year = "20#{item["year"]}"
      result[year] = item["rate"]
    end

    result
  end

  helper_method :extract_domestic_violence_data

  # Toutes les autres méthodes prepare_*_geojson_data avec pluck
  def prepare_single_parent_geojson_data
    return unless @epci_single_parent_data.present? && @epci_single_parent_data["communes"].present?

    commune_codes = @epci_single_parent_data["communes"].map { |c| c["code"] }
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    features_single_parent = []

    @epci_single_parent_data["communes"].each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          single_parent_percentage: commune["single_parent_percentage"].to_f,
          single_parent_count: (commune["single_parent_families"] || 0).round,
          single_father_percentage: commune["single_father_percentage"].to_f,    # ← AJOUTÉ
          single_mother_percentage: commune["single_mother_percentage"].to_f,    # ← AJOUTÉ
          single_fathers: (commune["single_fathers"] || 0).round,                # ← AJOUTÉ
          single_mothers: (commune["single_mothers"] || 0).round,                # ← AJOUTÉ
          total_households: (commune["total_households"] || 0).round,             # ← AJOUTÉ
          year: @epci_single_parent_data["year"]
        },
        geometry: JSON.parse(geojson)
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

    commune_codes = @epci_large_families_data["communes"].map { |c| c["code"] }
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    features_large_families = []

    @epci_large_families_data["communes"].each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          large_families_percentage: commune["large_families_percentage"].to_f,
          large_families_count: (commune["large_families"] || 0).round,
          families_3_children_percentage: commune["families_3_children_percentage"].to_f,  # ← AJOUTÉ
          families_4_plus_percentage: commune["families_4_plus_percentage"].to_f,          # ← AJOUTÉ
          total_households: (commune["total_households"] || 0).round,                       # ← AJOUTÉ
          year: @epci_large_families_data["year"]
        },
        geometry: JSON.parse(geojson)
      }

      features_large_families << feature
    end

    @communes_large_families_geojson = {
      type: "FeatureCollection",
      features: features_large_families
    }.to_json
  end

  def prepare_revenues_geojson_data
    return unless @epci_revenues_data.present? && @epci_revenues_data["communes"].present?

    commune_codes = @epci_revenues_data["communes"].map { |c| c["code"] }
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    features_revenues = []
    latest_year = @epci_revenues_data["latest_year"]&.to_s || "2021"

    @epci_revenues_data["communes"].each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          median_revenue: commune.dig("median_revenues", latest_year).to_f,
          poverty_rate: commune.dig("poverty_rates", latest_year),
          latest_year: latest_year
        },
        geometry: JSON.parse(geojson)
      }

      features_revenues << feature
    end

    @communes_revenues_geojson = {
      type: "FeatureCollection",
      features: features_revenues
    }.to_json

    @epci_latest_revenue_year = latest_year.to_i
  end

  def prepare_schooling_geojson_data
    return unless @epci_schooling_communes_data.present? && @epci_schooling_communes_data["communes"].present?

    commune_codes = @epci_schooling_communes_data["communes"].map { |c| c["code"] }
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    features_schooling = []

    @epci_schooling_communes_data["communes"].each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          schooling_rate_2y: commune["schooling_rate_2y"].to_f,
          schooling_rate_3_5y: commune["schooling_rate_3_5y"].to_f
        },
        geometry: JSON.parse(geojson)
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

    commune_codes = @epci_childcare_communes_data["communes"].map { |c| c["code"] }
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    features_childcare = []

    @epci_childcare_communes_data["communes"].each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          global_coverage_rate: commune["global_coverage_rate"].to_f,
          year: @epci_childcare_communes_data["year"]
        },
        geometry: JSON.parse(geojson)
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

    commune_codes = @epci_women_employment_data["communes"].map { |c| c["code"] }
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    features_women_employment = []

    @epci_women_employment_data["communes"].each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      feature = {
        type: "Feature",
        properties: {
          code: commune["code"],
          name: commune["name"],
          activity_rate: commune["activity_rate"].to_f,
          employment_rate: commune["employment_rate"].to_f,
          part_time_rate_15_64: commune["part_time_rate_15_64"].to_f,        # ← AJOUTÉ
          part_time_rate_25_54: commune["part_time_rate_25_54"].to_f,        # ← AJOUTÉ
          women_15_64: (commune["women_15_64"] || 0).round,                  # ← AJOUTÉ
          women_active_15_64: (commune["women_active_15_64"] || 0).round,    # ← AJOUTÉ
          women_employed_15_64: (commune["women_employed_15_64"] || 0).round # ← AJOUTÉ
        },
        geometry: JSON.parse(geojson)
      }

      features_women_employment << feature
    end

    @communes_women_employment_geojson = {
      type: "FeatureCollection",
      features: features_women_employment
    }.to_json
  end

  def prepare_domestic_violence_geojson_data
    return unless @epci_domestic_violence_data.present? && @epci_domestic_violence_data["communes"].present?

    commune_codes = @epci_domestic_violence_data["communes"].map { |c| c["code"] }
    geometries_by_code = CommuneGeometry.where(code_insee: commune_codes)
                                        .pluck(:code_insee, :geojson)
                                        .to_h

    features_domestic_violence = []

    latest_available_years = @epci_domestic_violence_data["communes"].map do |commune|
      commune["yearly_data"]&.map { |data| data["year"] } || []
    end.flatten.uniq.sort

    latest_year = latest_available_years.last
    short_year = latest_year.to_i
    full_year = "20#{short_year}"

    @epci_domestic_violence_data["communes"].each do |commune|
      geojson = geometries_by_code[commune["code"]]
      next unless geojson.present?

      latest_data = commune["yearly_data"]&.find { |d| d["year"] == short_year }
      violence_rate = latest_data ? latest_data["rate"] : nil

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
        geometry: JSON.parse(geojson)
      }

      features_domestic_violence << feature
    end

    @communes_domestic_violence_geojson = {
      type: "FeatureCollection",
      features: features_domestic_violence
    }.to_json

    @epci_latest_violence_year = full_year
  end

end
