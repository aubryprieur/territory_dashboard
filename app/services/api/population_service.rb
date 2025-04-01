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


