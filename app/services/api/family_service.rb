module Api
  class FamilyService
    def self.get_commune_families(code)
      ApiClientService.instance.get("/families/commune/#{code}")
    end

    def self.get_epci_families(code)
      ApiClientService.instance.get("/families/epci/#{code}")
    end

    def self.get_department_families(code)
      ApiClientService.instance.get("/families/department/#{code}")
    end

    def self.get_region_families(code)
      ApiClientService.instance.get("/families/region/#{code}")
    end

    def self.get_france_families
      ApiClientService.instance.get("/families/france")
    end
  end
end
