module Api
  class EpciSchoolingService
    def self.get_schooling_by_communes(epci_code)
      ApiClientService.instance.get("/epci/education/schooling/#{epci_code}/communes")
    end
  end
end
