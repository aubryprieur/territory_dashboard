# Observatoire interrégimes des situations de fragilité (2025) et APL ANCT — API /fragilities/*
module Api
  class FragilitiesService
    def self.get_commune(code) = ApiClientService.instance.get("/fragilities/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/fragilities/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/fragilities/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/fragilities/region/#{code}")
    # France métropolitaine (moyenne des régions pondérée par la population)
    def self.get_france = ApiClientService.instance.get("/fragilities/france")
  end
end
