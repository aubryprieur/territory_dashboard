module DashboardHelper
  def extract_domestic_violence_data(safety_data)
    return {} if safety_data.blank? || !safety_data.key?("data")

    # Filtrer les données pour ne garder que les violences intrafamiliales
    domestic_violence_data = safety_data["data"].select do |item|
      item["indicator_class"] == "Coups et blessures volontaires intrafamiliaux"
    end

    # Organiser les données par année
    result = {}
    domestic_violence_data.each do |item|
      year = "20#{item['year']}" # Convertir 16 en 2016, etc.
      result[year] = item["rate"]
    end

    result
  end

  def display_trend(evolution_percentage)
    return '' unless evolution_percentage

    if evolution_percentage > 0
      "<span class=\"text-green-600\">↑ +#{evolution_percentage.abs}%</span>".html_safe
    elsif evolution_percentage < 0
      "<span class=\"text-red-600\">↓ -#{evolution_percentage.abs}%</span>".html_safe
    else
      "<span class=\"text-gray-600\">→ 0%</span>".html_safe
    end
  end
end
