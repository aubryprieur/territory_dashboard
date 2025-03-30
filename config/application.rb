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

    # Configuration de l'API
    config.api = {
      base_url: Rails.application.credentials.dig(:api, :base_url) || ENV['API_BASE_URL'] || 'https://api-population-france-13608c575683.herokuapp.com',
      username: Rails.application.credentials.dig(:api, :username) || ENV['API_USERNAME'] || 'aubry',
      password: Rails.application.credentials.dig(:api, :password) || ENV['API_PASSWORD'] || 'IgnB+=vb)$cPzVPF2NF!'
    }

  end
end
