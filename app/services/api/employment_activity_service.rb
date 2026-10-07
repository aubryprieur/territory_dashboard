# Emploi et activité (INSEE RP 2012, 2017, 2023) — API /employment-activity/*
module Api
  class EmploymentActivityService
    def self.get_commune(code) = ApiClientService.instance.get("/employment-activity/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/employment-activity/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/employment-activity/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/employment-activity/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/employment-activity/france")
  end
end
