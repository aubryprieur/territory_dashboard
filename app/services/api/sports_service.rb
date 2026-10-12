# Licences sportives (INJEP, Observatoire des territoires) — API /sports/*
module Api
  class SportsService
    def self.get_commune(code) = ApiClientService.instance.get("/sports/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/sports/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/sports/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/sports/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/sports/france")
  end
end
