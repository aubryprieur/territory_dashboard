# Créations d'entreprises (Insee, SIDE) — API /business-creations/*
module Api
  class BusinessCreationsService
    def self.get_commune(code) = ApiClientService.instance.get("/business-creations/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/business-creations/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/business-creations/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/business-creations/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/business-creations/france")
  end
end
