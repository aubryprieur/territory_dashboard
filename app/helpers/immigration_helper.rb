# Onglet Immigrés et étrangers (API /immigration/*) : graphiques dessinés par charts/families_charts.js.
module ImmigrationHelper
  GAP_CATEGORIES = [
    ["unemployment_rate", "Chômage (15 ans ou +)"],
    ["employment_rate_25_54", "Emploi des 25-54 ans"],
    ["women_employment_rate_25_54", "Emploi des femmes de 25-54 ans"],
    ["women_homemakers_rate_25_54", "Femmes de 25-54 ans au foyer"],
    ["workers_employees_share", "Ouvriers et employés"]
  ].freeze

  # Barres groupées : immigrés / non-immigrés de la commune, et de la France en repère
  def immigration_gap_chart(commune, france, year, height: 260)
    series = [[commune, "imm", "Immigrés", "#312e81"], [commune, "nonimm", "Non-immigrés", "#0d9488"]]
    if france
      series += [[france, "imm", "Immigrés — #{france[:name]}", "#a5b4fc"],
                 [france, "nonimm", "Non-immigrés — #{france[:name]}", "#99f6e4"]]
    end
    config = {
      type: "bars", unit: "%",
      labels: GAP_CATEGORIES.map(&:last),
      datasets: series.map do |territory, group, label, color|
        label = "#{label} — #{territory[:name]}" if territory[:main]
        { label: label, data: GAP_CATEGORIES.map { |key, _| territory_value(territory, year, "#{group}_#{key}") },
          color: color }
      end
    }
    chart_canvas(config, height, "Immigrés et non-immigrés face à l'emploi")
  end
end
