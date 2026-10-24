# Cartes carroyées (Insee, Filosofi 2021, carreaux de 1 km) — API /grid/map/*
module Api
  class GridMapService
    def self.get_commune(code, indicator) = ApiClientService.instance.get("/grid/map/commune/#{code}", { indicator: indicator })
    def self.indicators = ApiClientService.instance.get("/grid/map/indicators")
  end
end
