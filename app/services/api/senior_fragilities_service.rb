# Observatoire interrégimes des situations de fragilité — retraités et seniors (interrégime, 2025) — API /senior-fragilities/*
module Api
  class SeniorFragilitiesService
    def self.get_commune(code) = ApiClientService.instance.get("/senior-fragilities/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/senior-fragilities/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/senior-fragilities/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/senior-fragilities/region/#{code}")
    # France entière (valeurs publiées par l'Observatoire)
    def self.get_france = ApiClientService.instance.get("/senior-fragilities/france")
  end
end
