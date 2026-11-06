# Données des communes d'un EPCI pour un jeu de données (API /epci-communes/{epci}/{dataset}) : cartes des communes
# du tableau de bord EPCI
module Api
  class EpciCommunesDatasetService
    def self.get(epci, dataset) = ApiClientService.instance.get("/epci-communes/#{epci}/#{dataset}")
  end
end
