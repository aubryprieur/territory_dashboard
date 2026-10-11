# Santé — AldService (API)
module Api
  class AldService
    def self.get_department(code) = ApiClientService.instance.get("/ald/department/#{code}")
    # France entière
    def self.get_france = ApiClientService.instance.get("/ald/france")
  end
end
