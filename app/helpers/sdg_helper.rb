# Indicateurs de développement durable (API /sdg-indicators/*) répartis dans plusieurs onglets.
# Chaque indicateur a ses propres millésimes : on calcule les années à afficher indicateur par indicateur.
module SdgHelper
  def sdg_territories
    comparison_territories("sdg_data", {
      commune: @sdg_data, epci: @epci_sdg_data, department: @department_sdg_data,
      region: @region_sdg_data, france: @france_sdg_data
    })
  end

  # Paramètres communs de _territory_indicator pour un indicateur (nil si la commune ne l'a pas)
  def sdg_common(key, territories = sdg_territories)
    commune = territories.find { |t| t[:key] == :commune }
    return nil unless commune

    years = (commune[:data].dig("available_years_by_indicator", key) || []).map(&:to_s).sort
    return nil if years.empty?

    latest = years.last
    comparison = years.reverse.find { |y| y.to_i <= latest.to_i - 5 } || years.first
    { territories: territories, years: years, latest: latest, comparison: comparison,
      table_years: ([comparison] + years.last(3)).uniq.sort }
  end
end
