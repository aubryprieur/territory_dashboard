# Ménages (INSEE RP 2012, 2017, 2023) — API /households/*
module Api
  class HouseholdService
    def self.get_commune_households(code)
      ApiClientService.instance.get("/households/commune/#{code}")
    end

    def self.get_epci_households(code)
      ApiClientService.instance.get("/households/epci/#{code}")
    end

    def self.get_department_households(code)
      ApiClientService.instance.get("/households/department/#{code}")
    end

    def self.get_region_households(code)
      ApiClientService.instance.get("/households/region/#{code}")
    end

    # France métropolitaine
    def self.get_france_households
      ApiClientService.instance.get("/households/france")
    end
  end
end
