# Population : structure par âge, pyramide, PCS, mobilité (INSEE RP 2012, 2017, 2023)
# et série longue 1968-2023 — API /population-structure/*
module Api
  class PopulationStructureService
    def self.get_commune(code) = ApiClientService.instance.get("/population-structure/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/population-structure/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/population-structure/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/population-structure/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/population-structure/france")
  end
end
