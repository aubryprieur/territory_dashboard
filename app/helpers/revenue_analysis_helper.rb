module RevenueAnalysisHelper
  def analyze_revenue_gap(commune_name, commune_oldest, commune_latest, territory_oldest, territory_latest, territory_name)
    analyzer = RevenueGapAnalyzer.new(commune_name)
    analyzer.analyze_gap_evolution(commune_oldest, commune_latest, territory_oldest, territory_latest, territory_name)
  end

  def format_revenue_analysis_cell(analysis_result)
    content_tag :td, class: "px-4 py-2 whitespace-nowrap text-sm #{analysis_result[:color]}" do
      if analysis_result[:details][:situation] && analysis_result[:details][:commune_growth_rate]
        content_with_tooltip(analysis_result)
      else
        analysis_result[:text]
      end
    end
  end

  private

  def content_with_tooltip(analysis_result)
    tooltip_content = build_tooltip_content(analysis_result[:details])

    content_tag :span,
                analysis_result[:text],
                class: "cursor-help",
                title: tooltip_content,
                data: {
                  toggle: "tooltip",
                  placement: "top"
                }
  end

  def build_tooltip_content(details)
    tooltip_parts = []

    if details[:interpretation]
      tooltip_parts << details[:interpretation]
    end

    if details[:commune_growth_rate] && details[:territory_growth_rate]
      tooltip_parts << "Croissance commune: #{details[:commune_growth_rate].round(1)}%"
      tooltip_parts << "Croissance territoire: #{details[:territory_growth_rate].round(1)}%"
    end

    tooltip_parts.join(" | ")
  end
end
