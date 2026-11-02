# Élections municipales, 1er tour (ministère de l'Intérieur) — API /municipal-elections/*
module Api
  class MunicipalElectionsService
    def self.get_commune(code) = ApiClientService.instance.get("/municipal-elections/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/municipal-elections/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/municipal-elections/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/municipal-elections/region/#{code}")
    # France métropolitaine (somme des communes)
    def self.get_france = ApiClientService.instance.get("/municipal-elections/france")
  end
end
