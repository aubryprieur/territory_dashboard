# Équipements géolocalisés d'une emprise (BPE 2025, API /equipment/points) : cartes de localisation
module Api
  class EquipmentPointsService
    DATA_VERSION = 2 # noms nettoyés (préfixes de gestionnaire et de département retirés)

    def self.get(west:, south:, east:, north:, group: "youth")
      # v : version des données (change la clé du cache brut après un nouvel import)
      ApiClientService.instance.get("/equipment/points", { west: west, south: south, east: east, north: north, group: group, v: DATA_VERSION })
    end
  end
end
