class RevenueGapAnalyzer
  def initialize(commune_name)
    @commune_name = commune_name
  end

  # Analyse l'évolution des écarts de revenus entre deux territoires
  # @param commune_oldest [Float] Revenu médian de la commune pour l'année la plus ancienne
  # @param commune_latest [Float] Revenu médian de la commune pour l'année la plus récente
  # @param territory_oldest [Float] Revenu médian du territoire de comparaison pour l'année la plus ancienne
  # @param territory_latest [Float] Revenu médian du territoire de comparaison pour l'année la plus récente
  # @param territory_name [String] Nom du territoire de comparaison
  # @return [Hash] Résultat de l'analyse avec le texte, la couleur et les détails
  def analyze_gap_evolution(commune_oldest, commune_latest, territory_oldest, territory_latest, territory_name)
    return { text: "Données insuffisantes", color: "text-gray-500", details: {} } if any_nil?(commune_oldest, commune_latest, territory_oldest, territory_latest)

    # Calcul des écarts (commune - territoire)
    initial_gap = commune_oldest - territory_oldest
    final_gap = commune_latest - territory_latest
    gap_evolution = final_gap - initial_gap

    # Calcul des taux de croissance
    commune_growth_rate = calculate_growth_rate(commune_oldest, commune_latest)
    territory_growth_rate = calculate_growth_rate(territory_oldest, territory_latest)

    # Détermination de la situation initiale
    initially_superior = initial_gap > 0
    finally_superior = final_gap > 0

    # Analyse détaillée
    analysis = perform_detailed_analysis(
      initial_gap: initial_gap,
      final_gap: final_gap,
      gap_evolution: gap_evolution,
      initially_superior: initially_superior,
      finally_superior: finally_superior,
      commune_growth_rate: commune_growth_rate,
      territory_growth_rate: territory_growth_rate,
      territory_name: territory_name
    )

    analysis
  end

  private

  def any_nil?(*values)
    values.any?(&:nil?)
  end

  def calculate_growth_rate(initial_value, final_value)
    return 0 if initial_value.nil? || initial_value.zero?
    ((final_value - initial_value) / initial_value.to_f) * 100
  end

  def perform_detailed_analysis(initial_gap:, final_gap:, gap_evolution:, initially_superior:, finally_superior:, commune_growth_rate:, territory_growth_rate:, territory_name:)

    # Seuil de tolérance pour considérer un écart comme stable (en euros)
    stability_threshold = 50

    if gap_evolution.abs <= stability_threshold
      return {
        text: "Écart stable",
        color: "text-gray-500",
        details: {
          situation: :stable,
          initial_gap: initial_gap,
          final_gap: final_gap,
          commune_growth_rate: commune_growth_rate,
          territory_growth_rate: territory_growth_rate
        }
      }
    end

    case [initially_superior, finally_superior]
    when [true, true]
      # Commune supérieure au début et à la fin
      analyze_superior_to_superior(gap_evolution, commune_growth_rate, territory_growth_rate, territory_name)

    when [true, false]
      # Commune supérieure au début, inférieure à la fin (inversion)
      analyze_superior_to_inferior(initial_gap, final_gap, territory_name)

    when [false, true]
      # Commune inférieure au début, supérieure à la fin (rattrapage et dépassement)
      analyze_inferior_to_superior(initial_gap, final_gap, territory_name)

    when [false, false]
      # Commune inférieure au début et à la fin
      analyze_inferior_to_inferior(gap_evolution, commune_growth_rate, territory_growth_rate, territory_name)
    end
  end

  def analyze_superior_to_superior(gap_evolution, commune_growth_rate, territory_growth_rate, territory_name)
    if gap_evolution > 0
      # L'écart se creuse en faveur de la commune
      {
        text: "Avantage renforcé (+#{format_currency(gap_evolution)})",
        color: "text-green-600",
        details: {
          situation: :advantage_reinforced,
          interpretation: "#{@commune_name} maintient son avance et l'augmente",
          commune_growth_rate: commune_growth_rate,
          territory_growth_rate: territory_growth_rate
        }
      }
    else
      # L'écart se réduit mais la commune reste supérieure
      {
        text: "Avantage réduit (#{format_currency(gap_evolution)})",
        color: "text-orange-500",
        details: {
          situation: :advantage_reduced,
          interpretation: "#{@commune_name} reste avantagée mais croît moins vite que #{territory_name}",
          commune_growth_rate: commune_growth_rate,
          territory_growth_rate: territory_growth_rate
        }
      }
    end
  end

  def analyze_superior_to_inferior(initial_gap, final_gap, territory_name)
    total_loss = initial_gap.abs + final_gap.abs
    {
      text: "Retournement défavorable (-#{format_currency(total_loss)})",
      color: "text-red-600",
      details: {
        situation: :reversal_unfavorable,
        interpretation: "#{@commune_name} était avantagée mais est maintenant défavorisée par rapport à #{territory_name}",
        initial_gap: initial_gap,
        final_gap: final_gap
      }
    }
  end

  def analyze_inferior_to_superior(initial_gap, final_gap, territory_name)
    total_gain = initial_gap.abs + final_gap.abs
    {
      text: "Rattrapage réussi (+#{format_currency(total_gain)})",
      color: "text-green-600",
      details: {
        situation: :successful_catchup,
        interpretation: "#{@commune_name} était défavorisée mais a rattrapé et dépassé #{territory_name}",
        initial_gap: initial_gap,
        final_gap: final_gap
      }
    }
  end

  def analyze_inferior_to_inferior(gap_evolution, commune_growth_rate, territory_growth_rate, territory_name)
    if gap_evolution > 0
      # L'écart se réduit (commune rattrape)
      {
        text: "Rattrapage en cours (+#{format_currency(gap_evolution)})",
        color: "text-green-600",
        details: {
          situation: :catching_up,
          interpretation: "#{@commune_name} réduit son retard par rapport à #{territory_name}",
          commune_growth_rate: commune_growth_rate,
          territory_growth_rate: territory_growth_rate
        }
      }
    else
      # L'écart se creuse (commune s'éloigne davantage)
      {
        text: "Retard accentué (#{format_currency(gap_evolution)})",
        color: "text-red-600",
        details: {
          situation: :falling_behind,
          interpretation: "#{@commune_name} creuse son retard par rapport à #{territory_name}",
          commune_growth_rate: commune_growth_rate,
          territory_growth_rate: territory_growth_rate
        }
      }
    end
  end

  def format_currency(value)
    return "0 €" if value.nil? || value.zero?

    formatted = value.abs.round(0)
    "#{formatted.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1 ').reverse} €"
  end
end
