# pass Sport 2024 (ministère des Sports, activations par commune de résidence) — API /pass-sport/*
module Api
  class PassSportService
    def self.get_commune(code) = ApiClientService.instance.get("/pass-sport/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/pass-sport/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/pass-sport/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/pass-sport/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/pass-sport/france")
  end
end
