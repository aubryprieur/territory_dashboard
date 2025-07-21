# app/services/epci_cache_service.rb
class EpciCacheService
  # Durées de cache adaptées
  CACHE_EPCI = 2.hours      # Données EPCI - durée moyenne
  CACHE_FRANCE = 12.hours   # Données France - durée longue (changent rarement)
  CACHE_TERRITORY = 4.hours # Données département/région - durée moyenne

  class << self
    # ================================
    # DONNÉES FRANCE (partagées par tous)
    # ================================

    def france_children_data
      Rails.cache.fetch("france:children_data", expires_in: CACHE_FRANCE) do
        Api::PopulationService.get_france_children_data
      end
    end

    def france_revenue_data
      Rails.cache.fetch("france:revenue_data", expires_in: CACHE_FRANCE) do
        Api::RevenueService.get_median_revenues_france
      end
    end

    def france_family_data
      Rails.cache.fetch("france:family_data", expires_in: CACHE_FRANCE) do
        Api::FamilyService.get_france_families
      end
    end

    def france_schooling_data
      Rails.cache.fetch("france:schooling_data", expires_in: CACHE_FRANCE) do
        Api::SchoolingService.get_france_schooling
      end
    end

    def france_childcare_data
      Rails.cache.fetch("france:childcare_data", expires_in: CACHE_FRANCE) do
        Api::ChildcareService.get_coverage_france
      end
    end

    def france_employment_data
      Rails.cache.fetch("france:employment_data", expires_in: CACHE_FRANCE) do
        Api::EmploymentService.get_france_employment
      end
    end

    def france_family_employment_under3_data
      Rails.cache.fetch("france:family_employment_under3", expires_in: CACHE_FRANCE) do
        Api::FamilyEmploymentService.get_under3_france
      end
    end

    def france_family_employment_3to5_data
      Rails.cache.fetch("france:family_employment_3to5", expires_in: CACHE_FRANCE) do
        Api::FamilyEmploymentService.get_3to5_france
      end
    end

    # ================================
    # DONNÉES DÉPARTEMENT
    # ================================

    def department_data(department_code)
      return {} if department_code.blank?

      Rails.cache.fetch("department:#{department_code}:all_data", expires_in: CACHE_TERRITORY) do
        {
          children_data: Api::PopulationService.get_department_children_data(department_code),
          revenue_data: Api::RevenueService.get_median_revenues_department(department_code),
          family_data: Api::FamilyService.get_department_families(department_code),
          schooling_data: Api::SchoolingService.get_department_schooling(department_code),
          childcare_data: Api::ChildcareService.get_coverage_by_department(department_code),
          employment_data: Api::EmploymentService.get_department_employment(department_code),
          family_employment_under3_data: Api::FamilyEmploymentService.get_under3_department(department_code),
          family_employment_3to5_data: Api::FamilyEmploymentService.get_3to5_department(department_code),
          domestic_violence_data: get_department_domestic_violence_data(department_code)
        }
      end
    end

    # ================================
    # DONNÉES RÉGION
    # ================================

    def region_data(region_code)
      return {} if region_code.blank?

      Rails.cache.fetch("region:#{region_code}:all_data", expires_in: CACHE_TERRITORY) do
        {
          children_data: Api::PopulationService.get_region_children_data(region_code),
          revenue_data: Api::RevenueService.get_median_revenues_region(region_code),
          family_data: Api::FamilyService.get_region_families(region_code),
          schooling_data: Api::SchoolingService.get_region_schooling(region_code),
          childcare_data: Api::ChildcareService.get_coverage_by_region(region_code),
          employment_data: Api::EmploymentService.get_region_employment(region_code),
          family_employment_under3_data: Api::FamilyEmploymentService.get_under3_region(region_code),
          family_employment_3to5_data: Api::FamilyEmploymentService.get_3to5_region(region_code),
          domestic_violence_data: get_region_domestic_violence_data(region_code)
        }
      end
    end

    # ================================
    # DONNÉES EPCI ESSENTIELLES
    # ================================

    def epci_essential_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:essential", expires_in: CACHE_EPCI) do
        Api::EpciCommunesService.get_children_by_communes(epci_code)
      end
    end

    # ================================
    # DONNÉES EPCI PAR SECTION
    # ================================

    def epci_families_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:families", expires_in: CACHE_EPCI) do
        {
          family_data: Api::FamilyService.get_epci_families(epci_code),
          families_data: Api::EpciFamiliesService.get_couples_with_children(epci_code),
          single_parent_data: Api::EpciFamiliesService.get_single_parent_families(epci_code),
          large_families_data: Api::EpciFamiliesService.get_large_families(epci_code)
        }
      end
    end

    def epci_births_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:births", expires_in: CACHE_EPCI) do
        Api::EpciBirthsService.get_births_by_communes(epci_code)
      end
    end

    def epci_children_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:children", expires_in: CACHE_EPCI) do
        {
          children_data: Api::PopulationService.get_epci_children_data(epci_code),
          population_data: Api::EpciPopulationService.get_population_data(epci_code),
          historical_data: Api::EpciHistoricalService.get_historical_data(epci_code)
        }
      end
    end

    def epci_schooling_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:schooling", expires_in: CACHE_EPCI) do
        {
          schooling_data: Api::SchoolingService.get_epci_schooling(epci_code),
          schooling_communes_data: Api::EpciSchoolingService.get_schooling_by_communes(epci_code)
        }
      end
    end

    def epci_economic_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:economic", expires_in: CACHE_EPCI) do
        {
          revenues_data: Api::EpciRevenuesService.get_epci_revenues(epci_code),
          revenue_data: Api::RevenueService.get_median_revenues_epci(epci_code)
        }
      end
    end

    def epci_childcare_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:childcare", expires_in: CACHE_EPCI) do
        {
          childcare_data: Api::ChildcareService.get_coverage_by_epci(epci_code),
          childcare_communes_data: Api::EpciChildcareService.get_coverage_by_communes(epci_code)
        }
      end
    end

    def epci_family_employment_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:family_employment", expires_in: CACHE_EPCI) do
        {
          family_employment_under3_data: Api::FamilyEmploymentService.get_under3_epci(epci_code),
          family_employment_3to5_data: Api::FamilyEmploymentService.get_3to5_epci(epci_code)
        }
      end
    end

    def epci_women_employment_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:women_employment", expires_in: CACHE_EPCI) do
        Api::EpciWomenEmploymentService.get_employment_by_communes(epci_code)
      end
    end

    def epci_domestic_violence_data(epci_code)
      Rails.cache.fetch("epci:#{epci_code}:domestic_violence", expires_in: CACHE_EPCI) do
        Api::EpciDomesticViolenceService.get_domestic_violence_by_communes(epci_code)
      end
    end

    # ================================
    # GESTION DU CACHE
    # ================================

    # Invalidation du cache pour un EPCI spécifique
    def invalidate_epci_cache(epci_code)
      pattern = "epci:#{epci_code}:*"
      Rails.cache.delete_matched(/epci:#{Regexp.escape(epci_code)}:.*/)
    end

    # Invalidation du cache France
    def invalidate_france_cache
      Rails.cache.delete_matched(/france:.*/)
    end

    # Invalidation du cache département
    def invalidate_department_cache(department_code)
      Rails.cache.delete_matched(/department:#{Regexp.escape(department_code)}:.*/)
    end

    # Invalidation du cache région
    def invalidate_region_cache(region_code)
      Rails.cache.delete_matched(/region:#{Regexp.escape(region_code)}:.*/)
    end

    # Vérifier si une clé est en cache
    def cached?(cache_key)
      Rails.cache.exist?(cache_key)
    end

    # Statistiques de cache (pour debugging)
    def cache_info(epci_code)
      sections = %w[essential families births children schooling economic childcare family_employment women_employment domestic_violence]

      info = {
        france_cached: cached?("france:children_data"),
        epci_sections: {}
      }

      sections.each do |section|
        cache_key = section == 'essential' ? "epci:#{epci_code}:essential" : "epci:#{epci_code}:#{section}"
        info[:epci_sections][section] = cached?(cache_key)
      end

      info
    end

    # ================================
    # ✅ MÉTHODES PRIVÉES CORRECTES
    # ================================

    private

    def get_department_domestic_violence_data(department_code)
      return {} if department_code.blank?

      begin
        # ✅ Utiliser le service existant avec la bonne méthode
        Api::EpciDomesticViolenceService.get_department_domestic_violence(department_code)
      rescue => e
        Rails.logger.error "Erreur récupération violences domestiques département #{department_code}: #{e.message}"
        {}
      end
    end

    def get_region_domestic_violence_data(region_code)
      return {} if region_code.blank?

      begin
        # ✅ Utiliser le service existant avec la bonne méthode
        Api::EpciDomesticViolenceService.get_region_domestic_violence(region_code)
      rescue => e
        Rails.logger.error "Erreur récupération violences domestiques région #{region_code}: #{e.message}"
        {}
      end
    end
  end
end
