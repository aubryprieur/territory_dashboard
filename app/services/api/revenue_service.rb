module Api
  class RevenueService
    def self.get_median_revenues(code)
      ApiClientService.instance.get("/revenues/median/commune/#{code}")
    end
    def self.get_median_revenues_epci(code)
      ApiClientService.instance.get("/revenues/median/epci/#{code}")
    end

    def self.get_median_revenues_department(code)
      ApiClientService.instance.get("/revenues/median/department/#{code}")
    end

    def self.get_median_revenues_region(code)
      ApiClientService.instance.get("/revenues/median/region/#{code}")
    end

    def self.get_median_revenues_france
      ApiClientService.instance.get("/revenues/median/france")
    end
  end
end

