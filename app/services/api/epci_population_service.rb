module Api
  class EpciPopulationService
    def self.get_population_data(epci_code)
      ApiClientService.instance.get("/epci/population/#{epci_code}")
    end
  end
end
