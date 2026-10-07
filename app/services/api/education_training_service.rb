# Scolarisation et diplômes (INSEE RP 2012, 2017, 2023) — API /education-training/*
module Api
  class EducationTrainingService
    def self.get_commune(code) = ApiClientService.instance.get("/education-training/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/education-training/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/education-training/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/education-training/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/education-training/france")
  end
end
