# Équipements et services (INSEE, Base permanente des équipements 2025) — API /equipment/*
module Api
  class EquipmentService
    def self.get_commune(code) = ApiClientService.instance.get("/equipment/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/equipment/epci/#{code}")
  end
end
