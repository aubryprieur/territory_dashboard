# app/controllers/concerns/dashboard_cache.rb
module DashboardCache
  extend ActiveSupport::Concern

  private

  # Méthode générique pour la mise en cache des appels API
  # Les réponses vides ou en erreur ne sont jamais mises en cache :
  # un échec ponctuel de l'API ne doit pas masquer des données pendant des heures.
  def cached_api_call(cache_key, expires_in: 1.hour, &block)
    cached = Rails.cache.read(cache_key)
    return cached if cacheable_api_result?(cached)

    Rails.logger.debug "🔄 Cache MISS pour: #{cache_key}"
    result = block.call
    if cacheable_api_result?(result)
      Rails.cache.write(cache_key, result, expires_in: expires_in)
      Rails.logger.debug "✅ Données mises en cache: #{cache_key}"
    else
      Rails.logger.warn "⚠️ Réponse vide ou en erreur, non mise en cache: #{cache_key}"
    end
    result
  rescue => e
    Rails.logger.error "❌ Erreur lors de la mise en cache #{cache_key}: #{e.message}"
    # En cas d'erreur, exécuter directement sans cache
    block.call
  end

  def cacheable_api_result?(value)
    return false if value.blank?
    return false if value.is_a?(Hash) && value.key?("error")
    true
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

  def cached_children_data(territory_code)
    cache_key = cache_key_for_territory(territory_code, 'children')
    cached_api_call(cache_key, expires_in: 4.hours) do
      Api::PopulationService.get_children_data(territory_code)
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

  def cached_commune_geometries(codes_insee)
    return {} if codes_insee.blank?

    cache_key = "commune_geometries_#{codes_insee.sort.join('_')}"
    cached_api_call(cache_key, expires_in: 1.day) do
      CommuneGeometry.where(code_insee: codes_insee)
                     .pluck(:code_insee, :geojson)
                     .to_h
    end
  end

  # Méthode utilitaire pour obtenir les codes INSEE d'un EPCI
  def get_epci_commune_codes(epci_code)
    cache_key = "epci_commune_codes_#{epci_code}"
    cached_api_call(cache_key, expires_in: 1.day) do
      Territory.where(epci: epci_code).pluck(:codgeo)
    end
  end

  # === MÉNAGES (commune, EPCI, département, région, France métropolitaine) ===
  def cached_households_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FM", "households_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      case level
      when :commune then Api::HouseholdService.get_commune_households(code)
      when :epci then Api::HouseholdService.get_epci_households(code)
      when :department then Api::HouseholdService.get_department_households(code)
      when :region then Api::HouseholdService.get_region_households(code)
      when :france then Api::HouseholdService.get_france_households
      end
    end
  end

  # === SCOLARISATION ET DIPLÔMES (commune, EPCI, département, région, France métropolitaine) ===
  def cached_education_training_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FM", "education_training_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      level == :france ? Api::EducationTrainingService.get_france : Api::EducationTrainingService.public_send("get_#{level}", code)
    end
  end

  # Charge les 5 territoires dans @education_data, @epci_education_data, ...
  def load_education_training_comparison
    @education_data = cached_education_training_data(:commune, @territory_code)
    @epci_education_data = cached_education_training_data(:epci, @epci_code)
    @department_education_data = cached_education_training_data(:department, @department_code)
    @region_education_data = cached_education_training_data(:region, @region_code)
    @france_education_data = cached_education_training_data(:france)
  end

  # === EMPLOI ET ACTIVITÉ (commune, EPCI, département, région, France métropolitaine) ===
  def cached_employment_activity_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FM", "employment_activity_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      level == :france ? Api::EmploymentActivityService.get_france : Api::EmploymentActivityService.public_send("get_#{level}", code)
    end
  end

  # Charge les 5 territoires dans @emp_data, @epci_emp_data, ...
  def load_employment_activity_comparison
    @emp_data = cached_employment_activity_data(:commune, @territory_code)
    @epci_emp_data = cached_employment_activity_data(:epci, @epci_code)
    @department_emp_data = cached_employment_activity_data(:department, @department_code)
    @region_emp_data = cached_employment_activity_data(:region, @region_code)
    @france_emp_data = cached_employment_activity_data(:france)
  end

  def cached_housing_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FM", "housing_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      level == :france ? Api::HousingService.get_france : Api::HousingService.public_send("get_#{level}", code)
    end
  end

  # Charge les 5 territoires dans @housing_data, @epci_housing_data, ...
  def load_housing_comparison
    @housing_data = cached_housing_data(:commune, @territory_code)
    @epci_housing_data = cached_housing_data(:epci, @epci_code)
    @department_housing_data = cached_housing_data(:department, @department_code)
    @region_housing_data = cached_housing_data(:region, @region_code)
    @france_housing_data = cached_housing_data(:france)
  end

  def cached_population_structure_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FM", "population_structure_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      level == :france ? Api::PopulationStructureService.get_france : Api::PopulationStructureService.public_send("get_#{level}", code)
    end
  end

  # Charge les 5 territoires dans @pop_data, @epci_pop_data, ...
  def load_population_structure_comparison
    @pop_data = cached_population_structure_data(:commune, @territory_code)
    @epci_pop_data = cached_population_structure_data(:epci, @epci_code)
    @department_pop_data = cached_population_structure_data(:department, @department_code)
    @region_pop_data = cached_population_structure_data(:region, @region_code)
    @france_pop_data = cached_population_structure_data(:france)
  end

  def cached_childcare_offer_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FE", "childcare_offer_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      level == :france ? Api::ChildcareOfferService.get_france : Api::ChildcareOfferService.public_send("get_#{level}", code)
    end
  end

  # Charge les 5 territoires dans @cc_data, @epci_cc_data, ...
  def load_childcare_offer_comparison
    @cc_data = cached_childcare_offer_data(:commune, @territory_code)
    @epci_cc_data = cached_childcare_offer_data(:epci, @epci_code)
    @department_cc_data = cached_childcare_offer_data(:department, @department_code)
    @region_cc_data = cached_childcare_offer_data(:region, @region_code)
    @france_cc_data = cached_childcare_offer_data(:france)
  end

  def cached_caf_benefits_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FM", "caf_benefits_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      level == :france ? Api::CafBenefitsService.get_france : Api::CafBenefitsService.public_send("get_#{level}", code)
    end
  end

  # Charge les 5 territoires dans @caf_data, @epci_caf_data, ...
  def load_caf_benefits_comparison
    @caf_data = cached_caf_benefits_data(:commune, @territory_code)
    @epci_caf_data = cached_caf_benefits_data(:epci, @epci_code)
    @department_caf_data = cached_caf_benefits_data(:department, @department_code)
    @region_caf_data = cached_caf_benefits_data(:region, @region_code)
    @france_caf_data = cached_caf_benefits_data(:france)
  end

  def cached_revenues_poverty_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FM", "revenues_poverty_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      level == :france ? Api::RevenuesPovertyService.get_france : Api::RevenuesPovertyService.public_send("get_#{level}", code)
    end
  end

  # Établissements scolaires (Éducation nationale) d'une commune ou d'un EPCI
  def cached_schools_data(level, code)
    return nil if code.blank?
    cache_key = cache_key_for_territory(code, "schools_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) { Api::SchoolsService.public_send("get_#{level}", code) }
  end


  # Immigrés et étrangers (recensement 2023) : commune, EPCI, département, région, France métropolitaine
  def cached_immigration_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FM", "immigration_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      level == :france ? Api::ImmigrationService.get_france : Api::ImmigrationService.public_send("get_#{level}", code)
    end
  end

  def load_immigration_comparison
    @immigration_data = cached_immigration_data(:commune, @territory_code)
    @epci_immigration_data = cached_immigration_data(:epci, @epci_code)
    @department_immigration_data = cached_immigration_data(:department, @department_code)
    @region_immigration_data = cached_immigration_data(:region, @region_code)
    @france_immigration_data = cached_immigration_data(:france)
  end

  # Tissu économique local (Flores 2017 et 2021) : onglets Emploi et Garde d'enfants
  def cached_economic_fabric_data(level, code = nil)
    return nil if level != :france && code.blank?
    cache_key = cache_key_for_territory(code || "FM", "economic_fabric_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) do
      level == :france ? Api::EconomicFabricService.get_france : Api::EconomicFabricService.public_send("get_#{level}", code)
    end
  end

  def load_economic_fabric_comparison
    @fabric_data = cached_economic_fabric_data(:commune, @territory_code)
    @epci_fabric_data = cached_economic_fabric_data(:epci, @epci_code)
    @department_fabric_data = cached_economic_fabric_data(:department, @department_code)
    @region_fabric_data = cached_economic_fabric_data(:region, @region_code)
    @france_fabric_data = cached_economic_fabric_data(:france)
  end

  # Équipements et services (BPE 2025) : commune (avec densités comparées et distances calculées par l'API)
  def cached_equipment_data(level, code)
    return nil if code.blank?
    cache_key = cache_key_for_territory(code, "equipment_#{level}")
    cached_api_call(cache_key, expires_in: 12.hours) { Api::EquipmentService.public_send("get_#{level}", code) }
  end

  def load_schools_data
    @schools_data = cached_schools_data(:commune, @territory_code)
    @epci_schools_data = cached_schools_data(:epci, @epci_code)
  end

  # Charge les 5 territoires dans @rev_data, @epci_rev_data, ...
  def load_revenues_poverty_comparison
    @rev_data = cached_revenues_poverty_data(:commune, @territory_code)
    @epci_rev_data = cached_revenues_poverty_data(:epci, @epci_code)
    @department_rev_data = cached_revenues_poverty_data(:department, @department_code)
    @region_rev_data = cached_revenues_poverty_data(:region, @region_code)
    @france_rev_data = cached_revenues_poverty_data(:france)
  end

  # === MÉTHODES CACHÉES POUR LES DONNÉES DE COMPARAISON FRANCE ===

  def cached_france_children_data
    cache_key = cache_key_for_france('children')
    cached_api_call(cache_key, expires_in: 1.day) do
      Api::PopulationService.get_france_children_data
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

        # Précharger aussi les données de comparaison les plus utilisées
        cached_france_children_data

        if epci_code.present?
          cached_epci_children_data(epci_code)
        end

        Rails.logger.info "✅ Préchargement terminé pour #{territory_code}"
      rescue => e
        Rails.logger.error "❌ Erreur lors du préchargement: #{e.message}"
      end
    end
  end
end
