# app/controllers/concerns/dashboard_cache.rb
module DashboardCache
  extend ActiveSupport::Concern

  private

  # Méthode générique pour la mise en cache des appels API
  def cached_api_call(cache_key, expires_in: 1.hour, &block)
    Rails.cache.fetch(cache_key, expires_in: expires_in) do
      Rails.logger.debug "🔄 Cache MISS pour: #{cache_key}"
      result = block.call
      Rails.logger.debug "✅ Données mises en cache: #{cache_key}"
      result
    end
  rescue => e
    Rails.logger.error "❌ Erreur lors de la mise en cache #{cache_key}: #{e.message}"
    # En cas d'erreur, exécuter directement sans cache
    block.call
  end

  # Générer une clé de cache basée sur le territoire et la date
  def cache_key_for_territory(territory_code, data_type, date: Date.current)
    "dashboard_#{data_type}_#{territory_code}_#{date.strftime('%Y%m%d')}"
  end

  # Générer une clé de cache pour les données nationales
  def cache_key_for_france(data_type, date: Date.current)
    "dashboard_france_#{data_type}_#{date.strftime('%Y%m%d')}"
  end

  # === MÉTHODES CACHÉES POUR LES DONNÉES PRINCIPALES ===

  def cached_population_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'population')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::PopulationService.get_commune_data(territory_code)
    end
  end

  def cached_age_pyramid_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'age_pyramid')
    cached_api_call(cache_key, expires_in: 6.hours) do
      population_data = cached_population_data(territory_code)
      prepare_age_pyramid_data(population_data)
    end
  end

  def cached_children_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'children')
    cached_api_call(cache_key, expires_in: 4.hours) do
      Api::PopulationService.get_children_data(territory_code)
    end
  end

  def cached_historical_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'historical')
    cached_api_call(cache_key, expires_in: 12.hours) do
      Api::HistoricalService.get_historical_data(territory_code)
    end
  end

  def cached_revenue_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'revenue')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::RevenueService.get_median_revenues(territory_code)
    end
  end

  def cached_schooling_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'schooling')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::SchoolingService.get_commune_schooling(territory_code)
    end
  end

  def cached_childcare_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'childcare')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::ChildcareService.get_coverage_by_commune(territory_code)
    end
  end

  def cached_births_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'births')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::PopulationService.get_births_data(territory_code)
    end
  end

  def cached_employment_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'employment')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::EmploymentService.get_commune_employment(territory_code)
    end
  end

  def cached_safety_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'safety')
    cached_api_call(cache_key, expires_in: 4.hours) do
      Api::PublicSafetyService.get_commune_safety(territory_code)
    end
  end

  def cached_family_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'family')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::FamilyService.get_commune_families(territory_code)
    end
  end

  def cached_family_employment_under3_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'family_employment_under3')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::FamilyEmploymentService.get_under3_commune(territory_code)
    end
  end

  def cached_family_employment_3to5_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'family_employment_3to5')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::FamilyEmploymentService.get_3to5_commune(territory_code)
    end
  end

  # === MÉTHODES CACHÉES POUR LES DONNÉES DE COMPARAISON FRANCE ===

  def cached_france_children_data
    cache_key = cache_key_for_france('children')
    cached_api_call(cache_key, expires_in: 1.day) do
      Api::PopulationService.get_france_children_data
    end
  end

  def cached_france_revenue_data
    cache_key = cache_key_for_france('revenue')
    cached_api_call(cache_key, expires_in: 1.day) do
      Api::RevenueService.get_median_revenues_france
    end
  end

  def cached_france_schooling_data
    cache_key = cache_key_for_france('schooling')
    cached_api_call(cache_key, expires_in: 1.day) do
      Api::SchoolingService.get_france_schooling
    end
  end

  def cached_france_employment_data
    cache_key = cache_key_for_france('employment')
    cached_api_call(cache_key, expires_in: 1.day) do
      Api::EmploymentService.get_france_employment
    end
  end

  def cached_france_childcare_data
    cache_key = cache_key_for_france('childcare')
    cached_api_call(cache_key, expires_in: 1.day) do
      Api::ChildcareService.get_coverage_france
    end
  end

  def cached_france_family_data
    cache_key = cache_key_for_france('family')
    cached_api_call(cache_key, expires_in: 1.day) do
      Api::FamilyService.get_france_families
    end
  end

  def cached_france_family_employment_under3_data
    cache_key = cache_key_for_france('family_employment_under3')
    cached_api_call(cache_key, expires_in: 1.day) do
      Api::FamilyEmploymentService.get_under3_france
    end
  end

  def cached_france_family_employment_3to5_data
    cache_key = cache_key_for_france('family_employment_3to5')
    cached_api_call(cache_key, expires_in: 1.day) do
      Api::FamilyEmploymentService.get_3to5_france
    end
  end

  # === MÉTHODES CACHÉES POUR LES DONNÉES EPCI ===

  def cached_epci_children_data(epci_code)
    return nil if epci_code.blank?
    cache_key = cache_key_for_territory(epci_code, 'epci_children')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::PopulationService.get_epci_children_data(epci_code)
    end
  end

  def cached_epci_revenue_data(epci_code)
    return nil if epci_code.blank?
    cache_key = cache_key_for_territory(epci_code, 'epci_revenue')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::RevenueService.get_median_revenues_epci(epci_code)
    end
  end

  def cached_epci_schooling_data(epci_code)
    return nil if epci_code.blank?
    cache_key = cache_key_for_territory(epci_code, 'epci_schooling')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::SchoolingService.get_epci_schooling(epci_code)
    end
  end

  def cached_epci_employment_data(epci_code)
    return nil if epci_code.blank?
    cache_key = cache_key_for_territory(epci_code, 'epci_employment')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::EmploymentService.get_epci_employment(epci_code)
    end
  end

  def cached_epci_childcare_data(epci_code)
    return nil if epci_code.blank?
    cache_key = cache_key_for_territory(epci_code, 'epci_childcare')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::ChildcareService.get_coverage_by_epci(epci_code)
    end
  end

  def cached_epci_family_data(epci_code)
    return nil if epci_code.blank?
    cache_key = cache_key_for_territory(epci_code, 'epci_family')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::FamilyService.get_epci_families(epci_code)
    end
  end

  def cached_epci_family_employment_under3_data(epci_code)
    return nil if epci_code.blank?
    cache_key = cache_key_for_territory(epci_code, 'epci_family_employment_under3')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::FamilyEmploymentService.get_under3_epci(epci_code)
    end
  end

  def cached_epci_family_employment_3to5_data(epci_code)
    return nil if epci_code.blank?
    cache_key = cache_key_for_territory(epci_code, 'epci_family_employment_3to5')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::FamilyEmploymentService.get_3to5_epci(epci_code)
    end
  end

  # === MÉTHODES CACHÉES POUR LES DONNÉES DÉPARTEMENT ===

  def cached_department_children_data(department_code)
    return nil if department_code.blank?
    cache_key = cache_key_for_territory(department_code, 'dept_children')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::PopulationService.get_department_children_data(department_code)
    end
  end

  def cached_department_revenue_data(department_code)
    return nil if department_code.blank?
    cache_key = cache_key_for_territory(department_code, 'dept_revenue')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::RevenueService.get_median_revenues_department(department_code)
    end
  end

  def cached_department_schooling_data(department_code)
    return nil if department_code.blank?
    cache_key = cache_key_for_territory(department_code, 'dept_schooling')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::SchoolingService.get_department_schooling(department_code)
    end
  end

  def cached_department_employment_data(department_code)
    return nil if department_code.blank?
    cache_key = cache_key_for_territory(department_code, 'dept_employment')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::EmploymentService.get_department_employment(department_code)
    end
  end

  def cached_department_safety_data(department_code)
    return nil if department_code.blank?
    cache_key = cache_key_for_territory(department_code, 'dept_safety')
    cached_api_call(cache_key, expires_in: 6.hours) do
      Api::PublicSafetyService.get_department_safety(department_code)
    end
  end

  def cached_department_childcare_data(department_code)
    return nil if department_code.blank?
    cache_key = cache_key_for_territory(department_code, 'dept_childcare')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::ChildcareService.get_coverage_by_department(department_code)
    end
  end

  def cached_department_family_data(department_code)
    return nil if department_code.blank?
    cache_key = cache_key_for_territory(department_code, 'dept_family')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::FamilyService.get_department_families(department_code)
    end
  end

  def cached_department_family_employment_under3_data(department_code)
    return nil if department_code.blank?
    cache_key = cache_key_for_territory(department_code, 'dept_family_employment_under3')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::FamilyEmploymentService.get_under3_department(department_code)
    end
  end

  def cached_department_family_employment_3to5_data(department_code)
    return nil if department_code.blank?
    cache_key = cache_key_for_territory(department_code, 'dept_family_employment_3to5')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::FamilyEmploymentService.get_3to5_department(department_code)
    end
  end

  # === MÉTHODES CACHÉES POUR LES DONNÉES RÉGION ===

  def cached_region_children_data(region_code)
    return nil if region_code.blank?
    cache_key = cache_key_for_territory(region_code, 'region_children')
    cached_api_call(cache_key, expires_in: 12.hours) do
      Api::PopulationService.get_region_children_data(region_code)
    end
  end

  def cached_region_revenue_data(region_code)
    return nil if region_code.blank?
    cache_key = cache_key_for_territory(region_code, 'region_revenue')
    cached_api_call(cache_key, expires_in: 12.hours) do
      Api::RevenueService.get_median_revenues_region(region_code)
    end
  end

  def cached_region_schooling_data(region_code)
    return nil if region_code.blank?
    cache_key = cache_key_for_territory(region_code, 'region_schooling')
    cached_api_call(cache_key, expires_in: 12.hours) do
      Api::SchoolingService.get_region_schooling(region_code)
    end
  end

  def cached_region_employment_data(region_code)
    return nil if region_code.blank?
    cache_key = cache_key_for_territory(region_code, 'region_employment')
    cached_api_call(cache_key, expires_in: 12.hours) do
      Api::EmploymentService.get_region_employment(region_code)
    end
  end

  def cached_region_safety_data(region_code)
    return nil if region_code.blank?
    cache_key = cache_key_for_territory(region_code, 'region_safety')
    cached_api_call(cache_key, expires_in: 8.hours) do
      Api::PublicSafetyService.get_region_safety(region_code)
    end
  end

  def cached_region_childcare_data(region_code)
    return nil if region_code.blank?
    cache_key = cache_key_for_territory(region_code, 'region_childcare')
    cached_api_call(cache_key, expires_in: 12.hours) do
      Api::ChildcareService.get_coverage_by_region(region_code)
    end
  end

  def cached_region_family_data(region_code)
    return nil if region_code.blank?
    cache_key = cache_key_for_territory(region_code, 'region_family')
    cached_api_call(cache_key, expires_in: 12.hours) do
      Api::FamilyService.get_region_families(region_code)
    end
  end

  def cached_region_family_employment_under3_data(region_code)
    return nil if region_code.blank?
    cache_key = cache_key_for_territory(region_code, 'region_family_employment_under3')
    cached_api_call(cache_key, expires_in: 12.hours) do
      Api::FamilyEmploymentService.get_under3_region(region_code)
    end
  end

  def cached_region_family_employment_3to5_data(region_code)
    return nil if region_code.blank?
    cache_key = cache_key_for_territory(region_code, 'region_family_employment_3to5')
    cached_api_call(cache_key, expires_in: 12.hours) do
      Api::FamilyEmploymentService.get_3to5_region(region_code)
    end
  end

  # === MÉTHODES UTILITAIRES ===

  # Invalider le cache pour un territoire spécifique
  def invalidate_territory_cache(territory_code)
    cache_pattern = "dashboard_*_#{territory_code}_*"
    Rails.logger.info "🗑️ Invalidation du cache pour le territoire: #{territory_code}"

    # Note: La méthode exacte dépend de votre store de cache
    # Pour Redis: Rails.cache.delete_matched(cache_pattern)
    # Pour Memory store: pas de delete_matched, il faut gérer manuellement

    if Rails.cache.respond_to?(:delete_matched)
      Rails.cache.delete_matched(cache_pattern)
    else
      Rails.logger.warn "⚠️ delete_matched non supporté par le store de cache actuel"
    end
  end

  # Invalider tout le cache du dashboard
  def invalidate_all_dashboard_cache
    Rails.logger.info "🗑️ Invalidation complète du cache dashboard"

    if Rails.cache.respond_to?(:delete_matched)
      Rails.cache.delete_matched("dashboard_*")
    else
      Rails.logger.warn "⚠️ delete_matched non supporté par le store de cache actuel"
    end
  end

  # Précharger les données essentielles en arrière-plan
  def preload_essential_data(territory_code, epci_code = nil, department_code = nil, region_code = nil)
    Rails.logger.info "🚀 Préchargement des données essentielles pour #{territory_code}"

    # Lancer les appels en arrière-plan (avec un job si nécessaire)
    Thread.new do
      begin
        cached_population_data(territory_code)
        cached_children_data(territory_code)
        cached_historical_data(territory_code)
        cached_revenue_data(territory_code)

        # Précharger aussi les données de comparaison les plus utilisées
        cached_france_children_data
        cached_france_revenue_data

        if epci_code.present?
          cached_epci_children_data(epci_code)
          cached_epci_revenue_data(epci_code)
        end

        Rails.logger.info "✅ Préchargement terminé pour #{territory_code}"
      rescue => e
        Rails.logger.error "❌ Erreur lors du préchargement: #{e.message}"
      end
    end
  end
end
