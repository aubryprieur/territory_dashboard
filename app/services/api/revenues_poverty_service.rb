# Revenus et pauvreté (INSEE, Filosofi 2017-2021 et 2023) — API /revenues-poverty/*
module Api
  class RevenuesPovertyService
    def self.get_commune(code) = ApiClientService.instance.get("/revenues-poverty/commune/#{code}")
    def self.get_epci(code) = ApiClientService.instance.get("/revenues-poverty/epci/#{code}")
    def self.get_department(code) = ApiClientService.instance.get("/revenues-poverty/department/#{code}")
    def self.get_region(code) = ApiClientService.instance.get("/revenues-poverty/region/#{code}")
    # France métropolitaine
    def self.get_france = ApiClientService.instance.get("/revenues-poverty/france")
  end
end
