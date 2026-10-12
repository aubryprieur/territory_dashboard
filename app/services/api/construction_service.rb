# Construction neuve de logements (SDES, Sitadel) — API /construction/*
module Api
  class ConstructionService
    def self.get_commune(code) = ApiClientService.instance.get("/construction/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/construction/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/construction/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/construction/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/construction/france")
  end
end
