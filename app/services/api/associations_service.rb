# Associations (RNA, export Waldec) — API /associations/*
module Api
  class AssociationsService
    def self.get_commune(code) = ApiClientService.instance.get("/associations/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/associations/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/associations/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/associations/region/#{code}")
    # France métropolitaine (hors Alsace-Moselle)
    def self.get_france = ApiClientService.instance.get("/associations/france")
  end
end
