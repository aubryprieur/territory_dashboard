# Synthèse des fragilités d'une commune (rangs national et par catégorie de densité) — API /fragility-synthesis/*
module Api
  class FragilitySynthesisService
    def self.get_commune(code) = ApiClientService.instance.get("/fragility-synthesis/commune/#{code}")
  end
end
