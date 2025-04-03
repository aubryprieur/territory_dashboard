module Api
  class PublicSafetyService
    def self.get_commune_safety(code)
      ApiClientService.instance.get("/public-safety/commune/#{code}")
    end

    def self.get_department_safety(code)
      ApiClientService.instance.get("/public-safety/department/#{code}")
    end

    def self.get_region_safety(code)
      ApiClientService.instance.get("/public-safety/region/#{code}")
    end
  end
end
