module Api
  class EmploymentService
    def self.get_commune_employment(code)
      ApiClientService.instance.get("/employment/rates/commune/#{code}")
    end

    def self.get_epci_employment(code)
      ApiClientService.instance.get("/employment/rates/epci/#{code}")
    end

    def self.get_department_employment(code)
      ApiClientService.instance.get("/employment/rates/department/#{code}")
    end

    def self.get_region_employment(code)
      ApiClientService.instance.get("/employment/rates/region/#{code}")
    end

    def self.get_france_employment
      ApiClientService.instance.get("/employment/rates/france")
    end
  end
end
