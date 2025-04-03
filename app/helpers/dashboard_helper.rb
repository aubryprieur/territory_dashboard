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
end
