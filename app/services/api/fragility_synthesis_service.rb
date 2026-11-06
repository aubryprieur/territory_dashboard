# Synthèse des fragilités (API /fragility-synthesis/*) : commune (rangs national et par catégorie de densité) et EPCI
# (rangs parmi tous les EPCI et parmi ceux de même nature, valeurs des communes membres)
module Api
  class FragilitySynthesisService
    def self.get_commune(code) = ApiClientService.instance.get("/fragility-synthesis/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/fragility-synthesis/epci/#{code}")
  end
end
