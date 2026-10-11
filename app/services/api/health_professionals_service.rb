# Santé — HealthProfessionalsService (API)
module Api
  class HealthProfessionalsService
    def self.get_commune(code) = ApiClientService.instance.get("/health-professionals/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/health-professionals/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/health-professionals/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/health-professionals/region/#{code}")
    def self.get_france = ApiClientService.instance.get("/health-professionals/france")
  end
end
