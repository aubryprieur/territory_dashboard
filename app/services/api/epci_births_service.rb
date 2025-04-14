module Api
  class EpciBirthsService
    def self.get_births_by_communes(epci_code)
      ApiClientService.instance.get("/epci/births/#{epci_code}/communes")
    end
  end
end
