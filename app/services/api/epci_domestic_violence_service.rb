module Api
  class EpciDomesticViolenceService
    def self.get_domestic_violence_by_communes(epci_code)
      ApiClientService.instance.get("/epci/public-safety/domestic-violence/#{epci_code}")
    end

    # Utilise le service PublicSafetyService et filtre les résultats
    def self.get_department_domestic_violence(department_code)
      ApiClientService.instance.get("/public-safety/department/#{department_code}")
    end

    # Même logique pour la région
    def self.get_region_domestic_violence(region_code)
      ApiClientService.instance.get("/public-safety/region/#{region_code}")
    end
  end
end
