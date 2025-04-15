module Api
  class EpciRevenuesService
    def self.get_epci_revenues(epci_code)
      ApiClientService.instance.get("/epci/revenues/#{epci_code}/communes")
    end
  end
end
