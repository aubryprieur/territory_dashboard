# Aides génériques pour comparer une commune à ses territoires de référence
# (EPCI, département, région, France métropolitaine) sur plusieurs millésimes.
# Réutilisable par tous les onglets alimentés par l'API "*_by_territory"
# (réponse : available_years, latest_year, comparison_year, <data_key> => { année => {...} }).
module TerritoryComparisonHelper
  SMALL_COUNT_THRESHOLD = 200 # INSEE : effectifs < 200 à manier avec précaution

  COMPARISON_COLORS = {
    commune: "#312e81",
    epci: "#0d9488",
    department: "#7c3aed",
    region: "#ea580c",
    france: "#dc2626"
  }.freeze

  # sources : { commune: data, epci: data, department: data, region: data, france: data }
  def comparison_territories(data_key, sources)
    names = {
      commune: @territory_name,
      epci: (@epci_code.present? ? epci_display_name : nil),
      department: department_display_name,
      region: region_display_name,
      france: "France métropolitaine"
    }
    COMPARISON_COLORS.keys.filter_map do |key|
      data = sources[key]
      next unless names[key].present? && data.is_a?(Hash) && data[data_key].present?

      { key: key, name: names[key], data: data, data_key: data_key,
        color: COMPARISON_COLORS[key], main: key == :commune }
    end
  end

  def comparison_years(main_data, data_key)
    years = main_data&.dig("available_years") || main_data&.dig(data_key)&.keys || []
    years.map(&:to_s).sort
  end

  def comparison_latest_year(main_data, years)
    (main_data&.dig("latest_year") || years.last).to_s
  end

  def comparison_start_year(main_data, years)
    (main_data&.dig("comparison_year") || years.first).to_s
  end

  def territory_value(territory, year, key)
    territory[:data].dig(territory[:data_key], year.to_s, key)
  end

  # ---------------------------------------------------------------- formats
  def fmt_pct(value, precision: 1)
    value.nil? ? "–" : number_to_percentage(value, precision: precision)
  end

  def fmt_count(value)
    value.nil? ? "–" : number_with_delimiter(value.round)
  end

  def fmt_decimal(value, precision: 2)
    value.nil? ? "–" : number_with_precision(value, precision: precision)
  end

  # Écart entre deux valeurs : "↓ −2,3 pts" (taux) ou "↓ −0,09" (autres)
  def fmt_trend(start_value, end_value, unit: :points, precision: 1)
    return "" if start_value.nil? || end_value.nil?

    diff = (end_value - start_value).round(precision)
    arrow = diff.positive? ? "↑" : (diff.negative? ? "↓" : "→")
    sign = diff.positive? ? "+" : (diff.negative? ? "−" : "")
    suffix = unit == :points ? (diff.abs >= 2 ? " pts" : " pt") : ""
    content_tag(:span, "#{arrow} #{sign}#{number_with_precision(diff.abs, precision: precision)}#{suffix}",
                class: "text-xs text-gray-600 whitespace-nowrap")
  end

  def small_count_flag(*counts)
    return "" unless counts.compact.any? { |c| c < SMALL_COUNT_THRESHOLD }

    content_tag(:span, "⚠", class: "ml-1 cursor-help", style: "color: #d97706",
                title: "Effectif inférieur à #{SMALL_COUNT_THRESHOLD} : à interpréter avec prudence (INSEE)")
  end

  def territory_dot(territory)
    content_tag(:span, nil, style: "display:inline-block;width:8px;height:8px;border-radius:9999px;" \
                                   "margin-right:8px;background-color:#{territory[:color]}")
  end

  # --------------------------------------------------------------- graphiques
  # Les canvas portent leur configuration ; dessinés par charts/families_charts.js.
  def comparison_line_chart(territories, years, key, unit: "%", height: 224)
    config = {
      type: "line", unit: unit, labels: years,
      datasets: territories.map do |t|
        { label: t[:name], data: years.map { |y| territory_value(t, y, key) }, color: t[:color], main: t[:main] }
      end
    }
    chart_canvas(config, height, "Évolution #{years.join(', ')} par territoire")
  end

  # Barres horizontales empilées (100 %) : une barre par territoire, un segment par catégorie.
  # categories : [[clé_du_taux, libellé, couleur], ...]
  def comparison_stacked_chart(territories, year, categories, aria_label)
    config = {
      type: "stacked",
      labels: territories.map { |t| t[:name] },
      datasets: categories.map do |key, label, color|
        { label: label, data: territories.map { |t| territory_value(t, year, key) }, color: color }
      end
    }
    chart_canvas(config, 70 + territories.size * 44, aria_label)
  end

  # Barres verticales groupées : catégories en abscisse, un groupe de barres par territoire.
  # categories : [[clé_du_taux, libellé], ...]
  def comparison_grouped_bar_chart(territories, year, categories, aria_label, unit: "%", height: 260)
    config = {
      type: "bars", unit: unit,
      labels: categories.map(&:last),
      datasets: territories.map do |t|
        { label: t[:name], data: categories.map { |key, _| territory_value(t, year, key) }, color: t[:color], main: t[:main] }
      end
    }
    chart_canvas(config, height, aria_label)
  end

  private

  def chart_canvas(config, height, aria_label)
    content_tag(:div, class: "relative", style: "height: #{height}px") do
      content_tag(:canvas, nil, data: { families_chart: config.to_json }, role: "img", "aria-label": aria_label)
    end
  end
end
