# Cartes IRIS en SVG, sans fond de carte ni JavaScript : chaque IRIS est coloré selon son écart à la valeur
# de la commune (somme de ses IRIS, même millésime). Coordonnées WGS84 projetées en équirectangulaire corrigé
# de la latitude, suffisant à l'échelle d'une commune.
module IrisMapHelper
  # 5 classes d'écart relatif à la commune : couleurs divergentes lisibles par les daltoniens
  IRIS_CLASSES = [
    { max: 0.75, color: "#2166ac", label: "nettement inférieur" },
    { max: 0.92, color: "#92c5de", label: "inférieur" },
    { max: 1.08, color: "#f0f0f0", label: "proche de la commune" },
    { max: 1.25, color: "#f4a582", label: "supérieur" },
    { max: Float::INFINITY, color: "#b2182b", label: "nettement supérieur" }
  ].freeze
  IRIS_NO_DATA = "#d4d4d8".freeze

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
    v.nil? ? "–" : "#{number_with_precision(v, precision: 1, separator: ',', delimiter: ' ')}#{unit == '%' ? ' %' : ''}"
  end

  def iris_rings(geometry)
    case geometry["type"]
    when "Polygon" then geometry["coordinates"]
    when "MultiPolygon" then geometry["coordinates"].flatten(1)
    else []
    end
  end

  # SVG de la carte : polygones, étiquettes de valeur, info-bulle (title)
  def iris_map_svg(map, year, width: 520, max_height: 460)
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
      cls = iris_class(value, reference)
      d = iris_rings(f["geometry"]).map { |ring| "M" + ring.map { |lon, lat| project.(lon, lat).join(",") }.join("L") + "Z" }.join
      count = iris_value(f, year, "count")
      total = iris_value(f, year, "total")
      tip = "#{f['iris_name']} : #{fmt_iris(value, unit)}"
      tip += " (#{fmt_count(count)} sur #{fmt_count(total)})" if count && total
      content_tag(:path, content_tag(:title, tip), d: d, fill: cls ? cls[:color] : IRIS_NO_DATA,
                  stroke: "#ffffff", "stroke-width": 1.5, "fill-rule": "evenodd")
    end

    labels = features.filter_map do |f|
      lon, lat = f["label"]
      next if lon.nil?
      x, y = project.(lon, lat)
      content_tag(:text, fmt_iris(iris_value(f, year), unit), x: x, y: y, "text-anchor": "middle", "dominant-baseline": "middle",
                  "font-size": 11, "font-weight": 600, fill: "#111827", stroke: "#ffffff", "stroke-width": 3,
                  "paint-order": "stroke", style: "pointer-events:none")
    end

    content_tag(:svg, safe_join(shapes + labels), viewBox: "0 0 #{w} #{height}", width: "100%",
                style: "max-width:#{w}px;height:auto", role: "img",
                "aria-label": "Carte des IRIS : #{map.dig('indicator', 'label')}")
  end
end
