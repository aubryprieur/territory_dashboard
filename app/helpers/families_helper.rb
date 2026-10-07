# Aides d'affichage pour l'onglet Familles (dashboard commune).
# Données : API /families/* (INSEE RP 2012, 2017, 2023 — valeurs officielles par territoire).
module FamiliesHelper
  SMALL_COUNT_THRESHOLD = 200 # INSEE : effectifs < 200 à manier avec précaution

  TERRITORY_COLORS = {
    commune: "#312e81",
    epci: "#0d9488",
    department: "#7c3aed",
    region: "#ea580c",
    france: "#dc2626"
  }.freeze

  # Territoires affichés (commune + comparaisons), dans l'ordre, avec leurs données API
  def families_territories
    @families_territories ||= [
      { key: :commune, name: @territory_name, data: @family_data, main: true },
      { key: :epci, name: (@epci_code.present? ? epci_display_name : nil), data: @epci_family_data },
      { key: :department, name: department_display_name, data: @department_family_data },
      { key: :region, name: region_display_name, data: @region_family_data },
      { key: :france, name: "France métropolitaine", data: @france_family_data }
    ].select { |t| t[:name].present? && t[:data].is_a?(Hash) && t[:data]["family_data"].present? }
     .map { |t| t.merge(color: TERRITORY_COLORS[t[:key]]) }
  end

  # Millésimes disponibles (["2012", "2017", "2023"])
  def family_years
    years = @family_data&.dig("available_years") || @family_data&.dig("family_data")&.keys || []
    years.map(&:to_s).sort
  end

  def family_latest_year
    (@family_data&.dig("latest_year") || family_years.last).to_s
  end

  # Millésime de comparaison : le plus récent situé au moins 5 ans avant le dernier
  def family_comparison_year
    (@family_data&.dig("comparison_year") || family_years.first).to_s
  end

  def family_value(territory, year, key)
    territory[:data].dig("family_data", year.to_s, key)
  end

  # "44,8 %" ou "–"
  def family_pct(value, precision: 1)
    value.nil? ? "–" : number_to_percentage(value, precision: precision)
  end

  def family_count(value)
    value.nil? ? "–" : number_with_delimiter(value.round)
  end

  # Écart en points de pourcentage entre deux taux : "↓ −2,3 pts"
  def family_points_trend(start_rate, end_rate)
    return "" if start_rate.nil? || end_rate.nil?

    diff = (end_rate - start_rate).round(1)
    arrow = diff.positive? ? "↑" : (diff.negative? ? "↓" : "→")
    sign = diff.positive? ? "+" : (diff.negative? ? "−" : "")
    unit = diff.abs >= 2 ? "pts" : "pt"
    content_tag(:span, "#{arrow} #{sign}#{number_with_precision(diff.abs, precision: 1)} #{unit}",
                class: "text-xs text-gray-600 whitespace-nowrap")
  end

  # Avertissement si l'effectif est faible
  def family_small_count_flag(*counts)
    return "" unless counts.compact.any? { |c| c < SMALL_COUNT_THRESHOLD }

    content_tag(:span, "⚠", class: "ml-1 cursor-help", style: "color: #d97706",
                title: "Effectif inférieur à #{SMALL_COUNT_THRESHOLD} : à interpréter avec prudence (INSEE)")
  end

  def family_small_count?(*counts)
    counts.compact.any? { |c| c < SMALL_COUNT_THRESHOLD }
  end

  # Graphique en lignes : un taux sur les millésimes, pour chaque territoire
  def families_line_chart(key, height: 224)
    config = {
      type: "line",
      labels: family_years,
      datasets: families_territories.map do |t|
        {
          label: t[:name],
          data: family_years.map { |y| family_value(t, y, key) },
          color: t[:color],
          main: t[:main] == true
        }
      end
    }
    content_tag(:div, class: "relative", style: "height: #{height}px") do
      content_tag(:canvas, nil, data: { families_chart: config.to_json },
                  role: "img", "aria-label": "Évolution #{family_years.join(', ')} par territoire")
    end
  end

  # Barres empilées : répartition des familles par nombre d'enfants (dernier millésime)
  CHILDREN_BUCKETS = [
    ["families_0_children", "Aucun enfant", "#e5e7eb"],
    ["families_1_child", "1 enfant", "#c7d2fe"],
    ["families_2_children", "2 enfants", "#818cf8"],
    ["families_with_3_children", "3 enfants", "#4f46e5"],
    ["families_with_4_plus_children", "4 enfants ou +", "#312e81"]
  ].freeze

  def families_children_chart
    year = family_latest_year
    shares = families_territories.map do |t|
      total = family_value(t, year, "total_families")
      CHILDREN_BUCKETS.map do |key, _, _|
        v = family_value(t, year, key)
        total.to_f.positive? && v ? (v / total * 100).round(2) : nil
      end
    end
    config = {
      type: "stacked",
      labels: families_territories.map { |t| t[:name] },
      datasets: CHILDREN_BUCKETS.each_with_index.map do |(_, label, color), i|
        { label: label, data: shares.map { |s| s[i] }, color: color }
      end
    }
    content_tag(:div, class: "relative", style: "height: #{70 + families_territories.size * 44}px") do
      content_tag(:canvas, nil, data: { families_chart: config.to_json },
                  role: "img", "aria-label": "Répartition des familles par nombre d'enfants de moins de 25 ans")
    end
  end
end
