# Indicateurs territoriaux de développement durable (INSEE / SDES, base ODD) — API /sdg-indicators/*
module Api
  class SdgIndicatorsService
    def self.get_commune(code) = ApiClientService.instance.get("/sdg-indicators/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/sdg-indicators/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/sdg-indicators/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/sdg-indicators/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/sdg-indicators/france")
  end
end
