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
  def comparison_territories(data_key, sources, france_name: "France métropolitaine")
    names = {
      commune: @territory_name,
      epci: (@epci_code.present? ? epci_display_name : nil),
      department: department_display_name,
      region: region_display_name,
      france: france_name
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
    # Ne garder que les millésimes où l'indicateur existe (ex. scolarisation à 2 ans : pas de 2012)
    years = years.select { |y| territories.any? { |t| !territory_value(t, y, key).nil? } }
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

  # ------------------------------------------------- population : série longue et pyramide
  # Série historique (API /population-structure/* -> "history") d'un territoire
  def territory_history(territory)
    territory && territory[:data].is_a?(Hash) ? (territory[:data]["history"] || {}) : {}
  end

  # Population en base 100 au premier recensement (1968), une courbe par territoire
  def history_index_chart(territories)
    years = territory_history(territories.first)["censuses"]&.map { |c| c["year"] } || []
    config = {
      type: "line", unit: "", labels: years,
      datasets: territories.map do |t|
        by_year = (territory_history(t)["censuses"] || []).to_h { |c| [c["year"], c["index_base_100"]] }
        { label: t[:name], data: years.map { |y| by_year[y] }, color: t[:color], main: t[:main] }
      end
    }
    chart_canvas(config, 260, "Évolution de la population depuis #{years.first} (base 100) par territoire")
  end

  # Taux de variation annuel moyen par période : part due au solde naturel et au solde migratoire
  def history_components_chart(territory)
    periods = territory_history(territory)["periods"] || []
    config = {
      type: "components", unit: "%",
      labels: periods.map { |p| p["period"] },
      datasets: [
        { label: "Dû au solde naturel (naissances - décès)", data: periods.map { |p| p["annual_natural_rate"] }, color: "#0d9488" },
        { label: "Dû au solde migratoire apparent (arrivées - départs)", data: periods.map { |p| p["annual_migration_rate"] }, color: "#f59e0b" },
        { label: "Variation annuelle totale", data: periods.map { |p| p["annual_growth_rate"] }, color: "#312e81", line: true }
      ]
    }
    chart_canvas(config, 280, "Composantes de la variation annuelle de la population par période")
  end

  # Colonnes empilées (une colonne par année, un segment par catégorie) et courbe du total
  # categories : [[clé, libellé, couleur], ...] ; total : [clé, libellé] (optionnel)
  def territory_stacked_columns_chart(territory, years, categories, aria_label, total: nil, unit: "", digits: 0)
    config = {
      type: "components", unit: unit, digits: digits, suffix: "",
      labels: years,
      datasets: categories.map do |key, label, color|
        { label: label, data: years.map { |y| territory_value(territory, y, key) }, color: color }
      end
    }
    if total
      config[:datasets] << { label: total.last, data: years.map { |y| territory_value(territory, y, total.first) },
                             color: "#111827", line: true }
    end
    chart_canvas(config, 300, aria_label)
  end

  # Pyramide des âges (% de la population) : hommes à gauche, femmes à droite ;
  # le territoire de référence (France métropolitaine) en contour
  def age_pyramid_chart(main, reference, year, groups, labels)
    values = ->(t, sex) { t ? groups.map { |g| territory_value(t, year, "pyr_#{sex}_#{g}_percentage") } : [] }
    config = {
      type: "pyramid",
      labels: groups.map { |g| labels[g] || g }.reverse,
      main: { name: main[:name], men: values.(main, "men").reverse, women: values.(main, "women").reverse },
      reference: reference && { name: reference[:name], men: values.(reference, "men").reverse,
                                women: values.(reference, "women").reverse }
    }
    chart_canvas(config, 480, "Pyramide des âges #{year}")
  end

  private

  def chart_canvas(config, height, aria_label)
    content_tag(:div, class: "relative", style: "height: #{height}px") do
      content_tag(:canvas, nil, data: { families_chart: config.to_json }, role: "img", "aria-label": aria_label)
    end
  end
end
