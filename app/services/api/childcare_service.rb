module Api
  class ChildcareService
    def self.get_coverage_by_commune(code)
      ApiClientService.instance.get("/childcare/commune/#{code}")
    end
  end
end
