# Foyers fiscaux (DGFiP, IRCOM) — API /tax-households/*
module Api
  class TaxHouseholdsService
    def self.get_commune(code) = ApiClientService.instance.get("/tax-households/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/tax-households/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/tax-households/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/tax-households/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/tax-households/france")
  end
end
