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
    "high" => ["Enjeu fort", "#fee2e2", "#b91c1c"], "moderate" => ["Enjeu modéré", "#ffedd5", "#c2410c"],
    "low" => ["Enjeu faible", "#dbeafe", "#1d4ed8"], "not_evaluable" => ["Non évaluable", "#f3f4f6", "#6b7280"],
    "context" => ["Contexte", "#eef2ff", "#4f46e5"]
  }.freeze

  INTENSITY_LEGEND = "Lecture : chaque barre situe l'intensité de l'enjeu dans la commune, du bleu (enjeu moins " \
                     "marqué que dans les autres communes) au rouge (enjeu plus marqué). Le rouge ne signale pas une " \
                     "situation négative : il indique une part plus élevée d'habitants concernés ou une situation " \
                     "plus défavorable qu'ailleurs, donc un enjeu à ne pas négliger dans l'analyse et le plan " \
                     "d'action. Pour les évolutions (population, naissances, concentration d'emploi), l'intensité " \
                     "mesure l'écart à la médiane, dans un sens ou dans l'autre.".freeze

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

  def enjeu_position_text(item, rank)
    x = enjeu_intensity(item, rank)
    return "" if x.nil?
    side = enjeu_side(item, rank)
    text = if x >= 80 then "parmi les #{[(100 - x).ceil, 1].max} % de communes où l'enjeu est le plus marqué"
           elsif x <= 20 then "parmi les #{[x.ceil, 1].max} % de communes où l'enjeu est le moins marqué"
           else "enjeu dans la moyenne"
           end
    side && x > 20 ? "#{side} : #{text}" : text
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

  # Barre d'intensité (curseur coloré selon la zone)
  def enjeu_bar(item, rank, height: 10)
    x = enjeu_intensity(item, rank)
    return "" if x.nil?
    marker_h = height + 6
    title = two_sided?(item) ? "Écart à la médiane : #{x.round} sur 100 (#{enjeu_side(item, rank)})" : "Intensité de l'enjeu : #{x.round} sur 100"
    content_tag(:div, style: "position:relative;height:#{height}px;border-radius:#{height / 2}px;background:#{INTENSITY_GRADIENT}", title: title) do
      content_tag(:span, "", style: "position:absolute;top:-3px;left:calc(#{x}% - 4px);width:8px;height:#{marker_h}px;border-radius:3px;background:#{enjeu_color(x)}")
    end
  end

  def enjeu_level_badge(level)
    ENJEU_LEVELS[level]
  end
end
