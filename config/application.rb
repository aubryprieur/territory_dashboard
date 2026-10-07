require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module TerritoryDashboard
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 8.0

    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration des paramètres de localisation
    config.i18n.default_locale = :fr
    config.i18n.available_locales = [:fr, :en]
    config.time_zone = 'Paris'

    # Formats de nombre français
    config.i18n.enforce_available_locales = true

    # Configuration de l'API : identifiants dans les credentials chiffrés (bin/rails credentials:edit)
    # ou dans les variables d'environnement API_BASE_URL / API_USERNAME / API_PASSWORD.
    # Aucun mot de passe dans le code : config/initializers/api_config_validation.rb signale un oubli.
    config.api = {
      base_url: Rails.application.credentials.dig(:api, :base_url) || ENV['API_BASE_URL'] || 'https://api-population-france-13608c575683.herokuapp.com',
      username: Rails.application.credentials.dig(:api, :username) || ENV['API_USERNAME'],
      password: Rails.application.credentials.dig(:api, :password) || ENV['API_PASSWORD']
    }

  end
end
