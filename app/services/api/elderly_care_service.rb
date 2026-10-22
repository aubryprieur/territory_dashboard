# Offre pour personnes âgées (INSEE, BPE 2025 : hébergement et places, services à domicile) — API /elderly-care/*
module Api
  class ElderlyCareService
    def self.get_commune(code) = ApiClientService.instance.get("/elderly-care/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/elderly-care/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/elderly-care/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/elderly-care/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/elderly-care/france")
  end
end
