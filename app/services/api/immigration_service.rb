# Immigrés et étrangers (INSEE, recensement 2023) — API /immigration/*
module Api
  class ImmigrationService
    def self.get_commune(code) = ApiClientService.instance.get("/immigration/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/immigration/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/immigration/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/immigration/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/immigration/france")
  end
end
