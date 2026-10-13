# Cartes IRIS en SVG, sans fond de carte ni JavaScript : chaque IRIS est coloré selon son écart à la valeur
# de la commune (somme de ses IRIS, même millésime). Coordonnées WGS84 projetées en équirectangulaire corrigé
# de la latitude, suffisant à l'échelle d'une commune.
module IrisMapHelper
  # 5 classes d'écart relatif à la commune : couleurs divergentes lisibles par les daltoniens
  IRIS_CLASSES = [
    { max: 0.75, color: "#2166ac", label: "nettement inférieur" },
    { max: 0.92, color: "#92c5de", label: "inférieur" },
    { max: 1.08, color: "#fde9a9", label: "proche de la commune" },
    { max: 1.25, color: "#f4a582", label: "supérieur" },
    { max: Float::INFINITY, color: "#b2182b", label: "nettement supérieur" }
  ].freeze
  # IRIS sans valeur (pas de population concernée : zones d'activité, gare…) : gris uni. Un motif hachuré SVG
  # (url(#…)) n'était pas résolu dans le dashboard : la zone apparaissait vide et sans info-bulle.
  IRIS_NO_DATA = "#c4c4c4".freeze
  IRIS_NO_DATA_SWATCH = IRIS_NO_DATA
  IRIS_MIN_TOTAL = 0  # aucun seuil : tous les IRIS sont colorés, même avec de petits effectifs (choix d'Aubry)

  def iris_value(feature, year, key = "value")
    feature.dig("values", year.to_s, key)
  end

  def iris_class(value, reference)
    return nil if value.nil? || reference.nil? || reference.zero?
    IRIS_CLASSES.find { |c| value / reference <= c[:max] }
  end

  # Bornes de la légende en valeurs réelles (ex. « 10,2 % à 12,5 % »)
  def iris_legend(reference, unit)
    return [] if reference.nil?
    lows = [nil, 0.75, 0.92, 1.08, 1.25]
    IRIS_CLASSES.each_with_index.map do |c, i|
      lo = lows[i] && reference * lows[i]
      hi = c[:max].finite? ? reference * c[:max] : nil
      range = if lo.nil? then "moins de #{fmt_iris(hi, unit)}"
              elsif hi.nil? then "plus de #{fmt_iris(lo, unit)}"
              else "#{fmt_iris(lo, unit)} à #{fmt_iris(hi, unit)}"
              end
      c.merge(range: range)
    end
  end

  def fmt_iris(v, unit = "%")
    return "–" if v.nil?
    return "#{number_with_delimiter(v.round, delimiter: ' ')} €" if unit == "€"
    "#{number_with_precision(v, precision: 1, separator: ',', delimiter: ' ')}#{unit == '%' ? ' %' : ''}"
  end

  # Écart entre deux millésimes : points pour un taux, euros pour un montant
  def iris_trend(v0, v1, unit)
    return "–" if v0.nil? || v1.nil?
    unit == "€" ? fmt_trend(v0, v1, unit: :euros) : fmt_trend(v0, v1)
  end

  def iris_rings(geometry)
    case geometry["type"]
    when "Polygon" then geometry["coordinates"]
    when "MultiPolygon" then geometry["coordinates"].flatten(1)
    else []
    end
  end

  # SVG de la carte : polygones, étiquettes de valeur, info-bulle (title)
  def iris_map_svg(map, year, width: 900, max_height: 600)
    features = map["features"] || []
    reference = map.dig("commune", "values", year.to_s, "value")
    unit = map.dig("indicator", "unit")
    rings = features.flat_map { |f| iris_rings(f["geometry"]) }
    points = rings.flatten(1)
    return "" if points.empty?

    lons = points.map(&:first)
    lats = points.map(&:last)
    k = Math.cos((lats.min + lats.max) / 2.0 * Math::PI / 180)
    pad = 8.0
    dx = (lons.max - lons.min) * k
    dy = lats.max - lats.min
    scale = [(width - 2 * pad) / dx, (max_height - 2 * pad) / dy].min
    height = (dy * scale + 2 * pad).round
    w = (dx * scale + 2 * pad).round
    project = ->(lon, lat) { [((lon - lons.min) * k * scale + pad).round(1), ((lats.max - lat) * scale + pad).round(1)] }

    shapes = features.map do |f|
      value = iris_value(f, year)
      total = iris_value(f, year, "total")
      too_small = !total.nil? && total < IRIS_MIN_TOTAL
      cls = too_small ? nil : iris_class(value, reference)
      d = iris_rings(f["geometry"]).map { |ring| "M" + ring.map { |lon, lat| project.(lon, lat).join(",") }.join("L") + "Z" }.join
      count = iris_value(f, year, "count")
      tip = "#{f['iris_name']} (IRIS #{f['iris_code']}) : #{fmt_iris(value, unit)}"
      tip += " — #{fmt_count(count)} sur #{fmt_count(total)}" if count && total
      tip += " — pas de valeur (IRIS sans population concernée)" if value.nil?
      tip += " — effectif trop faible pour être coloré" if value && too_small
      content_tag(:path, content_tag(:title, tip), d: d, fill: cls ? cls[:color] : IRIS_NO_DATA,
                  class: "iris-shape", stroke: "#374151", "stroke-width": 1, "stroke-linejoin": "round",
                  "vector-effect": "non-scaling-stroke", "fill-rule": "evenodd")
    end

    # survol : contour renforcé de l'IRIS (le détail s'affiche dans l'info-bulle)
    style = content_tag(:style, ".iris-shape{cursor:pointer}.iris-shape:hover{stroke:#000000;stroke-width:3}")
    content_tag(:svg, safe_join([style] + shapes), viewBox: "0 0 #{w} #{height}", width: "100%",
                style: "max-width:#{w}px;height:auto", role: "img",
                "aria-label": "Carte des IRIS : #{map.dig('indicator', 'label')}")
  end
end
