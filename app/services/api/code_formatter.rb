# app/services/api/code_formatter.rb
module Api
  module CodeFormatter
    def self.format_commune_code(code)
      return nil if code.blank?

      # Retirer les zéros au début pour les communes
      code.to_s.gsub(/^0+/, '')
    end

    def self.format_department_code(code)
      return nil if code.blank?

      # Cas spécial de la Corse
      return code if code.match?(/\A[0-9][A-B]\z/)

      # Retirer les zéros au début pour les départements normaux
      code.to_s.gsub(/^0+/, '')
    end

    def self.format_region_code(code)
      return nil if code.blank?

      # Retirer les zéros au début pour les régions
      code.to_s.gsub(/^0+/, '')
    end

    def self.format_epci_code(code)
      return nil if code.blank?

      # Conserver le format original pour les EPCI
      code.to_s
    end
  end
end
