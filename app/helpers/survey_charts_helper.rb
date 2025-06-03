# app/helpers/survey_charts_helper.rb
module SurveyChartsHelper
  def chart_colors(count)
    base_colors = [
      'rgba(79, 70, 229, 0.8)',   # Indigo
      'rgba(16, 185, 129, 0.8)',  # Green
      'rgba(245, 158, 11, 0.8)',  # Amber
      'rgba(239, 68, 68, 0.8)',   # Red
      'rgba(139, 92, 246, 0.8)',  # Purple
      'rgba(59, 130, 246, 0.8)',  # Blue
      'rgba(236, 72, 153, 0.8)',  # Pink
      'rgba(251, 146, 60, 0.8)',  # Orange
    ]

    # Répéter les couleurs si nécessaire
    colors = []
    (count / base_colors.length + 1).times { colors.concat(base_colors) }
    colors.first(count)
  end

  def format_percentage(value, total)
    return 0 if total.zero?
    (value.to_f / total * 100).round(1)
  end

  def truncate_label(text, max_length = 30)
    return text if text.length <= max_length
    "#{text[0..max_length-3]}..."
  end

  def question_response_rate(question, total_responses)
    responses_count = @statistics[question.id]&.is_a?(Hash) ? @statistics[question.id].values.sum : 0
    format_percentage(responses_count, total_responses)
  end
end
