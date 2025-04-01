module Api
  class SchoolingService
    def self.get_commune_schooling(code)
      ApiClientService.instance.get("/education/schooling/commune/#{code}")
    end

    def self.get_epci_schooling(code)
      ApiClientService.instance.get("/education/schooling/epci/#{code}")
    end

    def self.get_department_schooling(code)
      ApiClientService.instance.get("/education/schooling/department/#{code}")
    end

    def self.get_region_schooling(code)
      ApiClientService.instance.get("/education/schooling/region/#{code}")
    end

    def self.get_france_schooling
      ApiClientService.instance.get("/education/schooling/france")
    end
  end
end
