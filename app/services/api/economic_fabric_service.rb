# Tissu économique local (INSEE, Flores 2017 et 2021) — API /economic-fabric/*
module Api
  class EconomicFabricService
    def self.get_commune(code) = ApiClientService.instance.get("/economic-fabric/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/economic-fabric/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/economic-fabric/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/economic-fabric/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/economic-fabric/france")
  end
end
