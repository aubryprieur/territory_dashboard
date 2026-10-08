# Accueil du jeune enfant (Cnaf, data.caf.fr, 2017-2023) : places et taux de couverture par mode
# — API /childcare-offer/*
module Api
  class ChildcareOfferService
    def self.get_commune(code) = ApiClientService.instance.get("/childcare-offer/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/childcare-offer/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/childcare-offer/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/childcare-offer/region/#{code}")
    # France entière hors Mayotte (périmètre Cnaf)
    def self.get_france = ApiClientService.instance.get("/childcare-offer/france")
  end
end
