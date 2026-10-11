# Parc locatif social (SDES, RPLS) — API /social-housing/*
module Api
  class SocialHousingService
    def self.get_commune(code) = ApiClientService.instance.get("/social-housing/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/social-housing/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/social-housing/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/social-housing/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/social-housing/france")
  end
end
