module Api
  class ChildcareService
    def self.get_coverage_by_commune(code)
      ApiClientService.instance.get("/childcare/commune/#{code}")
    end

    def self.get_coverage_by_epci(code)
      ApiClientService.instance.get("/childcare/epci/#{code}")
    end

    def self.get_coverage_by_department(code)
      ApiClientService.instance.get("/childcare/department/#{code}")
    end

    def self.get_coverage_by_region(code)
      ApiClientService.instance.get("/childcare/region/#{code}")
    end

    def self.get_coverage_france
      ApiClientService.instance.get("/childcare/france")
    end
  end
end
