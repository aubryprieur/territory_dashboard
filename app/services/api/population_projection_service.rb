# Projections démographiques par commune (cohortes, 2023-2033) — API /population-projection/*
module Api
  class PopulationProjectionService
    def self.get_commune(code) = ApiClientService.instance.get("/population-projection/commune/#{code}")
    # EPCI : somme des projections de ses communes
    def self.get_epci(code) = ApiClientService.instance.get("/population-projection/epci/#{code}")
  end
end
