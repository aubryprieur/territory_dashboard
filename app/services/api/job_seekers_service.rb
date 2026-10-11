# Demandeurs d'emploi inscrits à France Travail (Dares, données communales) — API /job-seekers/*
module Api
  class JobSeekersService
    def self.get_commune(code) = ApiClientService.instance.get("/job-seekers/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/job-seekers/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/job-seekers/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/job-seekers/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/job-seekers/france")
  end
end
