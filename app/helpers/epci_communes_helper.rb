# Tableau de bord EPCI : cartes de comparaison des communes membres, au format des cartes IRIS (_iris_map, level:
# :communes). Valeurs des communes : API /epci-communes/{epci}/{jeu de données} (mêmes séries que la route communale).
module EpciCommunesHelper
  # Carte des communes pour un indicateur de _territory_indicator (nil hors tableau de bord EPCI ou sans données)
  def epci_indicator_map(territories, value_key, title:, value_format:, years:, source: nil)
    return nil unless @epci_mode
    main = territories.find { |t| t[:main] }
    return nil unless main && main[:data_key]
    ds = cached_epci_communes(main[:data_key])
    return nil unless ds.is_a?(Hash) && ds["values"].is_a?(Hash)

    yrs = years.compact.map(&:to_s).uniq
    values = {}
    ds["values"].each do |code, d|
      series = d.is_a?(Hash) ? (d[main[:data_key]] || {}) : {}
      vals = yrs.each_with_object({}) do |y, h|
        v = series.dig(y, value_key)
        h[y] = v.to_f if v.is_a?(Numeric)
      end
      values[code] = vals if vals.any?
    end
    reference = yrs.each_with_object({}) do |y, h|
      v = territory_value(main, y, value_key)
      h[y] = v.to_f if v.is_a?(Numeric)
    end
    yrs = yrs.select { |y| reference[y] || values.values.any? { |v| v[y] } }
    return nil if yrs.empty? || values.size < 2

    names = (ds["communes"] || []).to_h { |c| [c["code"], c["name"]] }
    unit = case value_format when :pct then "%" when :euros then "€" else "" end
    epci_communes_map(label: title, unit: unit, values: values, names: names, reference: reference, years: yrs,
                      source: source || "même source que l'indicateur, valeurs communales (cartes : IGN, Admin Express)")
  end
end
