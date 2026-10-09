# Délinquance enregistrée (SSMSI, 2016-2025) — API /delinquency/*
module Api
  class DelinquencyService
    def self.get_commune(code) = ApiClientService.instance.get("/delinquency/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/delinquency/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/delinquency/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/delinquency/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/delinquency/france")
  end
end
