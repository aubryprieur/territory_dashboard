module Api
  class EpciChildcareService
    def self.get_coverage_by_communes(epci_code, year = 2021)
      ApiClientService.instance.get("/epci/childcare/#{epci_code}/communes?year=#{year}")
    end
  end
end
