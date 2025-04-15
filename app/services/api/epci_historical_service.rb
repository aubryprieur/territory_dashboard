module Api
  class EpciHistoricalService
    def self.get_historical_data(epci_code)
      ApiClientService.instance.get("/epci/historical/#{epci_code}/communes")
    end
  end
end
