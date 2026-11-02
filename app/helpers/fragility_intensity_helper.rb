# Lecture « intensité de l'enjeu » des rangs de la synthèse des fragilités (encarts « Position parmi les communes » et
# repères de l'onglet Synthèse) : une seule échelle, du bleu (enjeu moins marqué que dans les autres communes) au rouge
# (enjeu plus marqué), sans jugement positif ou négatif.
#   - up / neutral : rang de l'API (100 = valeur la plus élevée = enjeu le plus marqué)
#   - down         : rang de l'API (déjà orienté : 100 = valeur la plus faible = enjeu le plus marqué)
#   - two_sided    : les deux extrêmes sont des enjeux (forte baisse / forte hausse) : intensité = écart à la médiane
module FragilityIntensityHelper
  INTENSITY_BLUE = "#2563eb".freeze
  INTENSITY_RED = "#dc2626".freeze
  INTENSITY_GREY = "#4b5563".freeze
  INTENSITY_GRADIENT = "linear-gradient(90deg,#93c5fd 0%,#dbeafe 20%,#f3f4f6 50%,#fee2e2 80%,#fca5a5 100%)".freeze

  # Onglet du dashboard -> clé de l'enjeu (thème principal ou groupe de contexte) dont le niveau est affiché
  TAB_ENJEU = {
    "synthese" => "population", "households" => "households", "families" => "families", "housing" => "housing",
    "children_comparison" => "early_childhood", "youth" => "youth", "schooling" => "schooling",
    "diplomas" => "diplomas", "employment" => "employment", "local_economy" => "economy",
    "revenues_poverty" => "poverty", "immigration" => "immigration", "caf_benefits" => "rights",
    "health" => "health", "seniors" => "seniors", "local_life" => "local_life", "delinquency" => "safety"
  }.freeze

  ENJEU_LEVELS = {
    "high" => ["Intensité forte", "#fee2e2", "#b91c1c"], "moderate" => ["Intensité modérée", "#ffedd5", "#c2410c"],
    "low" => ["Intensité faible", "#dbeafe", "#1d4ed8"], "not_evaluable" => ["Non évaluable", "#f3f4f6", "#6b7280"],
    "context" => ["Contexte", "#eef2ff", "#4f46e5"]
  }.freeze

  INTENSITY_LEGEND = "Lecture : chaque barre situe l'intensité de l'enjeu dans la commune, du bleu (enjeu moins " \
                     "marqué que dans les autres communes) au rouge (enjeu plus marqué). Le rouge ne signale pas une " \
                     "situation négative : il indique une part plus élevée d'habitants concernés ou une situation " \
                     "plus défavorable qu'ailleurs, donc un enjeu à ne pas négliger dans l'analyse et le plan " \
                     "d'action. Pour les évolutions (population, naissances, concentration d'emploi), l'intensité " \
                     "mesure l'écart à la médiane, dans un sens ou dans l'autre. La barre mesure l'enjeu, pas la " \
                     "valeur : les signes « − » et « + » aux extrémités indiquent le sens de la valeur ; pour les " \
                     "indicateurs marqués ▼, ils sont inversés (+ à gauche, − à droite) et c'est une valeur basse qui " \
                     "place le curseur à droite (par exemple, peu de licenciés sportifs ou un revenu bas).".freeze

  # Indicateur inversé : une valeur basse signale un enjeu plus marqué (licences, taux d'emploi, revenu, IPS…)
  def enjeu_reversed?(item)
    item["direction"] == "down"
  end

  # Libellé de l'indicateur, avec ▼ pour les indicateurs inversés
  def enjeu_label(item)
    return item["label"] unless enjeu_reversed?(item)
    safe_join([item["label"], " ",
               content_tag(:span, "▼", title: "Indicateur inversé : une valeur basse signale un enjeu plus marqué",
                           style: "color:#{INTENSITY_BLUE};font-size:0.8em;cursor:help")])
  end

  def two_sided?(item)
    item["direction"] == "two_sided"
  end

  def enjeu_intensity(item, rank)
    return nil if rank.nil?
    two_sided?(item) ? ((rank - 50).abs * 2).round(1) : rank
  end

  # Sens de l'écart pour un indicateur à double sens (« forte baisse » / « forte hausse »…)
  def enjeu_side(item, rank)
    return nil unless two_sided?(item) && rank
    sides = item["sides"].presence || ["valeur basse", "valeur élevée"]
    rank < 50 ? sides[0] : sides[1]
  end

  def enjeu_color(intensity)
    return INTENSITY_GREY if intensity.nil?
    intensity >= 80 ? INTENSITY_RED : (intensity <= 20 ? INTENSITY_BLUE : INTENSITY_GREY)
  end

  # Texte sous la barre : position de la valeur, puis intensité de l'enjeu qui en découle
  def enjeu_position_text(item, rank)
    x = enjeu_intensity(item, rank)
    return "" if x.nil?
    if two_sided?(item)
      side = enjeu_side(item, rank)
      return "écart à la médiane dans la moyenne" if x < 80 && x > 20
      return x >= 80 ? "#{side} : parmi les #{[(100 - x).ceil, 1].max} % d'écarts les plus forts, enjeu parmi les plus marqués" :
                       "proche de la médiane : enjeu peu marqué"
    end
    # rang 100 = valeur la plus élevée (up, neutral) ou la plus basse (down)
    high_side, low_side = enjeu_reversed?(item) ? ["basses", "élevées"] : ["élevées", "basses"]
    if x >= 80 then "valeur parmi les #{[(100 - x).ceil, 1].max} % les plus #{high_side} : enjeu parmi les plus marqués"
    elsif x <= 20 then "valeur parmi les #{[x.ceil, 1].max} % les plus #{low_side} : enjeu parmi les moins marqués"
    else "valeur dans la moyenne : enjeu dans la moyenne"
    end
  end

  # Rang dans l'EPCI (API : epci_position, 1 = valeur la plus « touchée » ; pour two_sided : la plus élevée)
  def enjeu_epci_text(item)
    k, n = item["epci_position"], item["epci_n"]
    return "" if k.nil?
    ord = k == 1 ? "1re" : "#{k}e"
    if two_sided?(item)
      "#{ord} valeur la plus élevée sur #{fmt_count(n)} communes"
    else
      "#{ord} commune où l'enjeu est le plus marqué, sur #{fmt_count(n)}"
    end
  end

  # Barre d'intensité (curseur coloré selon la zone), avec aux extrémités le sens de la valeur :
  # « − » / « + » (valeur plus basse / plus élevée) ; inversés pour les indicateurs ▼ (+ à gauche, − à droite) ;
  # « ≈ » / « ± » pour les évolutions (proche de la médiane / fort écart, à la hausse ou à la baisse)
  def enjeu_bar(item, rank, height: 10)
    x = enjeu_intensity(item, rank)
    return "" if x.nil?
    marker_h = height + 6
    title = two_sided?(item) ? "Écart à la médiane : #{x.round} sur 100 (#{enjeu_side(item, rank)})" : "Intensité de l'enjeu : #{x.round} sur 100"
    left, right, left_t, right_t =
      if two_sided?(item) then ["≈", "±", "proche de la médiane", "fort écart à la médiane (hausse ou baisse)"]
      elsif enjeu_reversed?(item) then ["+", "−", "valeur plus élevée", "valeur plus basse"]
      else ["−", "+", "valeur plus basse", "valeur plus élevée"]
      end
    end_style = "flex:none;width:12px;text-align:center;font-size:#{height >= 10 ? 13 : 11}px;font-weight:700;line-height:1;color:#6b7280;cursor:help"
    content_tag(:div, style: "display:flex;align-items:center;gap:4px") do
      safe_join([
        content_tag(:span, left, title: left_t, style: end_style),
        content_tag(:div, style: "position:relative;flex:1;height:#{height}px;border-radius:#{height / 2}px;background:#{INTENSITY_GRADIENT}", title: title) do
          content_tag(:span, "", style: "position:absolute;top:-3px;left:calc(#{x}% - 4px);width:8px;height:#{marker_h}px;border-radius:3px;background:#{enjeu_color(x)}")
        end,
        content_tag(:span, right, title: right_t, style: end_style)
      ])
    end
  end

  # Intensité d'un enjeu (tuile, badge d'encart) à partir des intensités de ses indicateurs (0-100) :
  #   forte    : intensité moyenne ≥ 70 (côté rouge) ou au moins la moitié des indicateurs à forte intensité (≥ 80)
  #   modérée  : intensité moyenne ≥ 40 (zone grise) ou au moins un quart des indicateurs à forte intensité
  #   faible   : sinon (côté bleu)
  # Non évaluable si moins de la moitié des indicateurs attendus ont une valeur.
  def enjeu_level(intensities, expected)
    xs = intensities.compact
    return "not_evaluable" if expected.zero? || xs.size < expected / 2.0 || xs.empty?
    mean = xs.sum / xs.size
    strong = xs.count { |x| x >= 80 }
    if mean >= 70 || strong >= xs.size * 0.5 then "high"
    elsif mean >= 40 || strong >= xs.size * 0.25 then "moderate"
    else "low"
    end
  end

  def enjeu_level_badge(level)
    ENJEU_LEVELS[level]
  end
end
