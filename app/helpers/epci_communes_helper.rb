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

  # Seuils des 5 classes : quintiles des valeurs des communes (effectifs)
  def epci_quintile_breaks(values)
    v = values.compact.sort
    return nil if v.size < 5
    [0.2, 0.4, 0.6, 0.8].map { |q| v[((v.size - 1) * q).round] }
  end

  # Onglet Population (tableau de bord EPCI) : carte des habitants et de la variation annuelle 2017-2023 des communes
  # (une carte par bouton, _map_group) ; nil hors tableau de bord EPCI
  def epci_population_maps(main, latest)
    return [] unless @epci_mode && main
    ds = cached_epci_communes("population_data")
    names = ds.is_a?(Hash) ? (ds["communes"] || []).to_h { |c| [c["code"], c["name"]] } : {}
    maps = []
    if ds.is_a?(Hash) && ds["values"].is_a?(Hash)
      pops = ds["values"].transform_values { |d| d.dig("population_data", latest.to_s, "pop") }.select { |_, v| v.is_a?(Numeric) }
      m = epci_communes_map(label: "Nombre d'habitants", unit: "n", values: pops.transform_values { |v| { latest.to_s => v } },
                            names: names, reference: { latest.to_s => territory_value(main, latest, "pop") }, years: [latest],
                            source: "INSEE, recensement de la population #{latest}")
      if m
        maps << { kind: :communes, map: m.merge("breaks" => epci_quintile_breaks(pops.values), "legend_low" => "Moins peuplées",
                                                "legend_high" => "Plus peuplées",
                                                "color_note" => "Couleur : cinq classes d'effectif comptant chacune environ un cinquième des communes ; l'EPCI compte #{fmt_count(territory_value(main, latest, 'pop'))} habitants."),
                  definition: "Population municipale de chaque commune." }
      end
    end
    syn = @fragility_synthesis.is_a?(Hash) ? @fragility_synthesis : {}
    growth = (syn["indicators"].to_a + syn["context_indicators"].to_a).find { |i| i["key"] == "population_growth_rate" }
    if growth && growth["communes"].present?
      year = growth["year"].to_s
      vals = growth["communes"].transform_values { |v| { year => v } }
      names = names.presence || (syn["communes"] || []).to_h { |c| [c["code"], c["name"]] }
      m = epci_communes_map(label: "Variation annuelle de la population #{year.to_i - 6}-#{year}", unit: "%/an", values: vals,
                            names: names, reference: { year => growth["value"] }, years: [year],
                            source: "INSEE, recensements de la population (série historique)")
      if m
        maps << { kind: :communes, map: m.merge("breaks" => [-1.0, -0.25, 0.25, 1.0], "legend_low" => "Baisse",
                                                "legend_high" => "Hausse",
                                                "color_note" => "Couleur : taux de variation annuel moyen ; entre −0,25 % et +0,25 % par an, la population est quasi stable. EPCI : #{fmt_iris(growth['value'], '%/an')}."),
                  definition: "Taux de variation annuel moyen de la population entre les deux derniers recensements." }
      end
    end
    maps
  end

  # Onglet Population (tableau de bord EPCI) : carte des naissances de la dernière année disponible par commune
  def epci_births_map(main)
    return nil unless @epci_mode
    data = cached_epci_communes_births
    return nil unless data.is_a?(Hash) && data["communes"].present?
    by_code = data["communes"].to_h { |c| [c["code"].to_s.rjust(5, "0"), c] }
    year = by_code.values.flat_map { |c| (c["births_by_year"] || {}).keys }.map(&:to_s).max
    return nil if year.nil?
    vals = by_code.transform_values { |c| (c["births_by_year"] || {}).transform_keys(&:to_s)[year] }.select { |_, v| v.is_a?(Numeric) }
    names = by_code.transform_values { |c| c["name"] }
    total = vals.values.sum
    m = epci_communes_map(label: "Naissances #{year}", unit: "n", values: vals.transform_values { |v| { year => v } }, names: names,
                          reference: { year => total }, years: [year], source: "INSEE, état civil, naissances domiciliées #{year}")
    m && m.merge("breaks" => epci_quintile_breaks(vals.values), "legend_low" => "Moins de naissances", "legend_high" => "Plus de naissances",
                 "color_note" => "Couleur : cinq classes comptant chacune environ un cinquième des communes ; #{fmt_count(total)} naissances dans l'EPCI en #{year}.")
  end
end
