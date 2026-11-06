# Équipements géolocalisés d'une emprise (BPE 2025, API /equipment/points) : cartes de localisation
module Api
  class EquipmentPointsService
    def self.get(west:, south:, east:, north:, group: "youth")
      ApiClientService.instance.get("/equipment/points", { west: west, south: south, east: east, north: north, group: group })
    end
  end
end
