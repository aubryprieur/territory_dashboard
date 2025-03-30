Rails.application.config.after_initialize do
  api_config = Rails.application.config.api

  missing_keys = []
  [:base_url, :username, :password].each do |key|
    missing_keys << key if api_config[key].nil?
  end

  unless missing_keys.empty?
    Rails.logger.error "CONFIGURATION ERREUR: Les informations d'API suivantes sont manquantes: #{missing_keys.join(', ')}"

    unless Rails.env.production?
      puts "\n\n========== ATTENTION ==========\n\n"
      puts "Les informations d'API suivantes sont manquantes: #{missing_keys.join(', ')}"
      puts "Veuillez configurer ces variables dans votre .env ou credentials\n\n"
      puts "================================\n\n"
    end
  end
end
