module Api
  class EpciWomenEmploymentService
    def self.get_employment_by_communes(epci_code)
      ApiClientService.instance.get("/epci/employment/women/#{epci_code}/communes")
    end
  end
end
