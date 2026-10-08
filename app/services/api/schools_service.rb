# Établissements scolaires (Éducation nationale, DEPP) — API /schools/*
module Api
  class SchoolsService
    def self.get_commune(code) = ApiClientService.instance.get("/schools/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/schools/epci/#{code}")
  end
end
