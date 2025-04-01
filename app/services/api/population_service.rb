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

# app/services/api/schooling_service.rb
module Api
  class SchoolingService
    def self.get_commune_schooling(code)
      ApiClientService.instance.get("/education/schooling/commune/#{code}")
    end
  end
end

# app/services/api/childcare_service.rb
module Api
  class ChildcareService
    def self.get_coverage_by_commune(code)
      ApiClientService.instance.get("/childcare/commune/#{code}")
    end
  end
end
