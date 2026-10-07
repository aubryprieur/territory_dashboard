# Logement (INSEE RP 2012, 2017, 2023) — API /housing/*
module Api
  class HousingService
    def self.get_commune(code) = ApiClientService.instance.get("/housing/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/housing/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/housing/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/housing/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/housing/france")
  end
end
