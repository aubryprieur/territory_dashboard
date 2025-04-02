# app/services/api/population_service.rb
module Api
  class PopulationService
    def self.get_commune_data(code)
      ApiClientService.instance.get("/population/#{code}")
    end

    def self.get_children_data(code)
      ApiClientService.instance.get("/population/children/commune/#{code}")
    end

    def self.get_epci_children_data(epci_code)
      ApiClientService.instance.get("/population/children/epci/#{epci_code}")
    end

    def self.get_department_children_data(department_code)
      ApiClientService.instance.get("/population/children/department/#{department_code}")
    end

    def self.get_region_children_data(region_code)
      ApiClientService.instance.get("/population/children/region/#{region_code}")
    end

    def self.get_france_children_data
      ApiClientService.instance.get("/population/children/france")
    end

    def self.get_births_data(code)
      ApiClientService.instance.get("/births/#{code}")
    end
  end
end

# app/services/api/historical_service.rb
module Api
  class HistoricalService
    def self.get_historical_data(code)
      ApiClientService.instance.get("/historical/#{code}")
    end
  end
end


