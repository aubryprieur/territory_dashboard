# Prestations CAF (Cnaf, data.caf.fr, décembre 2020-2024) : allocataires, personnes couvertes, montants,
# taux rapportés au recensement 2023 — API /caf-benefits/*
module Api
  class CafBenefitsService
    def self.get_commune(code) = ApiClientService.instance.get("/caf-benefits/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/caf-benefits/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/caf-benefits/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/caf-benefits/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/caf-benefits/france")
  end
end
