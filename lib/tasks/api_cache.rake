namespace :api_cache do
  desc "Précharge les données des communes les plus consultées"
  task preload_top_communes: :environment do
    top_communes = User.where.not(territory_code: nil).pluck(:territory_code).uniq.first(10)

    if top_communes.empty?
      puts "Aucune commune assignée aux utilisateurs."
      return
    end

    puts "Préchargement des données pour #{top_communes.size} communes..."

    top_communes.each do |code|
      puts "Commune #{code}..."

      # Précharger les statistiques de base
      Api::PopulationService.get_commune_data(code)
      Api::PopulationService.get_children_data(code)
      Api::HistoricalService.get_historical_data(code)
      Api::RevenueService.get_median_revenues(code)
      Api::SchoolingService.get_commune_schooling(code)
      Api::ChildcareService.get_coverage_by_commune(code)

      puts "✓ Données préchargées pour la commune #{code}"
    end

    puts "Préchargement terminé !"
  end
end
