# Santé — HealthInsuranceService (API)
module Api
  class HealthInsuranceService
    def self.get_commune(code) = ApiClientService.instance.get("/health-insurance/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/health-insurance/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/health-insurance/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/health-insurance/region/#{code}")
    def self.get_france = ApiClientService.instance.get("/health-insurance/france")
  end
end
