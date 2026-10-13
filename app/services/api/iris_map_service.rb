# Cartes IRIS (contours + indicateur par IRIS, 2017 et 2022) — API /iris/map/*
module Api
  class IrisMapService
    def self.get_commune(code, indicator) = ApiClientService.instance.get("/iris/map/commune/#{code}", { indicator: indicator })
    def self.indicators = ApiClientService.instance.get("/iris/map/indicators")
  end
end
