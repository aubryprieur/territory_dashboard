module Api
  class EpciFamiliesService
    def self.get_couples_with_children(epci_code)
      ApiClientService.instance.get("/epci/families/couples-with-children/#{epci_code}")
    end
  end
end
