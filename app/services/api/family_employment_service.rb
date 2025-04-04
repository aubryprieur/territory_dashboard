module Api
  class FamilyEmploymentService
    def self.get_under3_commune(code)
      ApiClientService.instance.get("/families/employment/under3/commune/#{code}")
    end

    def self.get_under3_epci(code)
      ApiClientService.instance.get("/families/employment/under3/epci/#{code}")
    end

    def self.get_under3_department(code)
      ApiClientService.instance.get("/families/employment/under3/department/#{code}")
    end

    def self.get_under3_region(code)
      ApiClientService.instance.get("/families/employment/under3/region/#{code}")
    end

    def self.get_under3_france
      ApiClientService.instance.get("/families/employment/under3/france")
    end

    def self.get_3to5_commune(code)
      ApiClientService.instance.get("/families/employment/3to5/commune/#{code}")
    end

    def self.get_3to5_epci(code)
      ApiClientService.instance.get("/families/employment/3to5/epci/#{code}")
    end

    def self.get_3to5_department(code)
      ApiClientService.instance.get("/families/employment/3to5/department/#{code}")
    end

    def self.get_3to5_region(code)
      ApiClientService.instance.get("/families/employment/3to5/region/#{code}")
    end

    def self.get_3to5_france
      ApiClientService.instance.get("/families/employment/3to5/france")
    end
  end
end
