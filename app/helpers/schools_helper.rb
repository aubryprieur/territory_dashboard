# Onglet Éducation nationale : établissements scolaires (API /schools/*), position nationale des IPS,
# valeurs ajoutées, indice d'éloignement. Les graphiques sont dessinés par charts/families_charts.js.
module SchoolsHelper
  SCHOOL_GROUPS = {
    "ecole" => "Écoles",
    "college" => "Collèges",
    "lycee_LEGT" => "Lycées généraux et technologiques",
    "lycee_LPO" => "Lycées polyvalents",
    "lycee_LP" => "Lycées professionnels"
  }.freeze

  # Couleurs des déciles (1 = valeurs les plus basses) : du rouge au vert pour l'IPS
  DECILE_COLORS = %w[#fee2e2 #fee2e2 #ffedd5 #ffedd5 #fef9c3 #fef9c3 #dcfce7 #dcfce7 #dbeafe #dbeafe].freeze
  DECILE_TEXT = %w[#991b1b #991b1b #9a3412 #9a3412 #854d0e #854d0e #166534 #166534 #1e40af #1e40af].freeze

  def school_value(school, year, key)
    school.dig("years", year.to_s, key)
  end

  # [année, valeur] de la dernière année renseignée pour l'indicateur
  def school_last(school, key)
    year = (school["years"] || {}).keys.map(&:to_i).sort.reverse.find { |y| school_value(school, y, key) }
    year ? [year, school_value(school, year, key)] : [nil, nil]
  end

  # Première année renseignée (pour l'évolution)
  def school_first(school, key)
    year = (school["years"] || {}).keys.map(&:to_i).sort.find { |y| school_value(school, y, key) }
    year ? [year, school_value(school, year, key)] : [nil, nil]
  end

  def school_years(schools, key)
    schools.flat_map { |s| (s["years"] || {}).select { |_, v| v[key] }.keys.map(&:to_i) }.uniq.sort
  end

  def rentree_label(year)
    year ? "#{year}-#{year.to_i + 1}" : "–"
  end

  def sector_label(sector)
    { "public" => "Public", "private" => "Privé sous contrat" }[sector] || "–"
  end

  def decile_label(decile)
    return "–" if decile.nil?

    decile.to_i == 1 ? "1er décile" : "#{decile.to_i}e décile"
  end

  def decile_badge(decile)
    return content_tag(:span, "–", class: "text-xs text-gray-400") if decile.nil?

    i = decile.to_i.clamp(1, 10) - 1
    content_tag(:span, decile_label(decile), class: "text-xs font-medium px-2 py-1 rounded whitespace-nowrap",
                                             style: "background-color:#{DECILE_COLORS[i]};color:#{DECILE_TEXT[i]}")
  end

  # Valeur ajoutée signée, verte si positive, rouge si négative
  def fmt_va(value)
    return content_tag(:span, "–", class: "text-gray-400") if value.nil?

    v = value.round
    color = v.positive? ? "#15803d" : (v.negative? ? "#b91c1c" : "#4b5563")
    sign = v.positive? ? "+" : (v.negative? ? "−" : "")
    content_tag(:span, "#{sign}#{v.abs} #{v.abs >= 2 ? 'pts' : 'pt'}", class: "font-medium whitespace-nowrap",
                                                                         style: "color:#{color}")
  end

  def fmt_va_score(value)
    return content_tag(:span, "–", class: "text-gray-400") if value.nil?

    color = value.positive? ? "#15803d" : (value.negative? ? "#b91c1c" : "#4b5563")
    sign = value.positive? ? "+" : (value.negative? ? "−" : "")
    content_tag(:span, "#{sign}#{number_with_precision(value.abs, precision: 1)}", class: "font-medium",
                                                                                     style: "color:#{color}")
  end

  # Phrase : part des établissements du même type en France ayant une valeur ajoutée inférieure
  def va_percentile_text(percentile)
    return "" if percentile.nil?

    "#{percentile.round} % des établissements font moins bien"
  end

  def school_group_label(group)
    SCHOOL_GROUPS[group] || group.to_s
  end

  # Graphique de positions : une ligne par type d'établissement, bandes des déciles nationaux,
  # points des établissements de la commune (en couleur) et des autres établissements de l'EPCI (en gris).
  def schools_positions_chart(main, others, national, key:, aria:, unit: "", per_row: 46)
    groups = SCHOOL_GROUPS.keys.select { |g| main.any? { |s| s["group"] == g && school_last(s, key).last } }
    return "" if groups.empty?

    points = lambda do |schools, main_flag|
      schools.filter_map do |s|
        row = groups.index(s["group"])
        year, value = school_last(s, key)
        next if row.nil? || value.nil?

        decile = school_value(s, year, "#{key}_decile")
        { x: value, y: row, label: s["name"].to_s.titleize, commune: s["commune_name"].to_s.titleize,
          decile: decile, main: main_flag }
      end
    end
    main_points = points.call(main, true)
    other_points = points.call(others, false)
    bands = groups.map do |g|
      year = main.select { |s| s["group"] == g }.filter_map { |s| school_last(s, key).first }.max
      ref = national.dig(g, key, year.to_s)
      ref && (1..9).map { |i| ref["d#{i}"] }
    end
    values = (main_points + other_points).map { |p| p[:x] } + bands.compact.flatten.compact
    config = {
      type: "positions", unit: unit,
      rows: groups.map { |g| school_group_label(g) },
      bands: bands, min: (values.min - 3).floor, max: (values.max + 3).ceil,
      datasets: [
        { label: @territory_name, data: main_points, color: "#312e81", main: true },
        { label: "Autres établissements de l'EPCI", data: other_points, color: "rgba(107,114,128,0.45)" }
      ]
    }
    chart_canvas(config, 70 + groups.size * per_row, aria)
  end

  # Courbes d'une valeur par année et par établissement (ex. valeur ajoutée du DNB)
  def schools_series_chart(schools, key, aria, unit: "pts", height: 220)
    years = school_years(schools, key)
    return "" if years.empty?

    palette = %w[#312e81 #0d9488 #ea580c #7c3aed #dc2626 #0284c7 #65a30d #db2777]
    config = {
      type: "line", unit: unit, labels: years.map(&:to_s),
      datasets: schools.each_with_index.map do |s, i|
        { label: s["name"].to_s.titleize, data: years.map { |y| school_value(s, y, key) },
          color: palette[i % palette.size], main: i.zero? }
      end
    }
    chart_canvas(config, height, aria)
  end

  # Positions d'indicateurs de résultats (réussite, valeur ajoutée) sur les déciles nationaux :
  # une ligne par indicateur. rows : [{ key:, label:, group: }] (group : groupe de la distribution nationale)
  # main : établissements mis en avant (couleur) ; others : établissements de contexte (gris).
  def schools_metric_chart(main, others, national, rows:, aria:, unit: "", digits: 0, main_label: nil, per_row: 46)
    rows = rows.select { |r| main.any? { |s| school_last(s, r[:key]).last } }
    return "" if rows.empty?

    bands = rows.map do |r|
      year = main.filter_map { |s| school_last(s, r[:key]).first }.max
      ref = national.dig(r[:group], r[:key], year.to_s)
      ref && (1..9).map { |i| ref["d#{i}"] }
    end
    points = lambda do |schools, main_flag|
      rows.each_with_index.flat_map do |r, i|
        schools.filter_map do |s|
          _, value = school_last(s, r[:key])
          next if value.nil?

          band = bands[i]
          decile = band && (band.compact.count { |d| value > d } + 1)
          { x: value, y: i, label: s["name"].to_s.titleize, commune: s["commune_name"].to_s.titleize,
            decile: decile, main: main_flag }
        end
      end
    end
    main_points = points.call(main, true)
    other_points = points.call(others, false)
    values = (main_points + other_points).map { |p| p[:x] } + bands.compact.flatten.compact
    pad = unit == "%" ? 2 : 1
    config = {
      type: "positions", unit: unit, digits: digits,
      rows: rows.map { |r| r[:label] },
      bands: bands, min: (values.min - pad).floor, max: [(values.max + pad).ceil, unit == "%" ? 100 : nil].compact.min,
      datasets: [
        { label: main_label || @territory_name, data: main_points, color: "#312e81", main: true },
        ({ label: "Autres établissements de l'EPCI", data: other_points, color: "rgba(107,114,128,0.45)" } if other_points.any?)
      ].compact
    }
    chart_canvas(config, 70 + rows.size * per_row, aria)
  end
end
