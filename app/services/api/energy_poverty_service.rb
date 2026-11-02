# Précarité énergétique logement (Géodip, ONPE, 2022) — API /energy-poverty/*
module Api
  class EnergyPovertyService
    def self.get_commune(code) = ApiClientService.instance.get("/energy-poverty/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/energy-poverty/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/energy-poverty/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/energy-poverty/region/#{code}")
    # France métropolitaine (pas d'estimation outre-mer)
    def self.get_france = ApiClientService.instance.get("/energy-poverty/france")
  end
end
