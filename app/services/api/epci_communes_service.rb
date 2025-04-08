module Api
  class EpciCommunesService
    def self.get_children_by_communes(epci_code)
      ApiClientService.instance.get("/epci/population/children/#{epci_code}/communes")
    end
  end
end
