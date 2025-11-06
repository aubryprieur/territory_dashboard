class PopulationProjectionService
  def self.projection_scenarios(current_population, years = 10)
    return {
      "scenario_conservative" => nil,
      "scenario_pessimistic" => nil
    } if current_population.nil? || current_population.zero?

    {
      "scenario_conservative" => project_population(current_population, 0.15, years),
      "scenario_pessimistic" => project_population(current_population, 0.20, years)
    }
  end

  # 🆕 Nouvelle méthode : Extraction des effectifs par âge avec projection
  def self.projection_by_age(population_by_age, years = 10)
    return {} if population_by_age.blank?

    # Extraire les effectifs actuels par âge (0, 1, 2, 3)
    current_data = {}
    (0..3).each do |age|
      age_items = population_by_age.select { |item| item["age"].to_i == age }
      men = age_items.sum { |item| item["men"].to_f }
      women = age_items.sum { |item| item["women"].to_f }
      current_data[age] = (men + women).round(0)
    end

    # Calculer les projections (-15% et -20%)
    projection_data = {}
    (0..3).each do |age|
      current = current_data[age]
      projection_data[age] = {
        "current" => current,
        "scenario_conservative" => (current * 0.85).round(0),      # -15%
        "scenario_pessimistic" => (current * 0.80).round(0)        # -20%
      }
    end

    {
      "by_age" => projection_data,
      "current_total" => current_data.values.sum,
      "conservative_total" => projection_data.map { |_, v| v["scenario_conservative"] }.sum,
      "pessimistic_total" => projection_data.map { |_, v| v["scenario_pessimistic"] }.sum
    }
  end

  private

  def self.project_population(current_population, decline_rate, years)
    projected = current_population * (1 - decline_rate)

    {
      "current" => current_population.round(0),
      "projected" => projected.round(0),
      "decline_absolute" => (current_population - projected).round(0),
      "decline_rate" => (decline_rate * 100).round(1),
      "years" => years
    }
  end
end
