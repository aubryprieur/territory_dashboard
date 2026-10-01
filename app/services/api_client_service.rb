class ApiClientService
  include Singleton

  def initialize
    @base_url = Rails.application.config.api[:base_url]
    @auth_service = ApiAuthService.new
  end

  def get(endpoint, params = {})
    with_caching(endpoint, params) do
      # Demande des réponses compressées (gzip) et les décompresse automatiquement
      response = HTTP
        .use(:auto_inflate)
        .headers("Accept-Encoding" => "gzip")
        .auth("Bearer #{@auth_service.get_token}")
        .get("#{@base_url}#{endpoint}", params: params)

      if response.status.success?
        JSON.parse(response.body.to_s)
      else
        Rails.logger.error("API error: #{response.status} for #{endpoint}")
        nil
      end
    end
  end

  private

  def with_caching(endpoint, params)
    cache_key = generate_cache_key(endpoint, params)

    # Vérifier dans Redis si la donnée est en cache
    cached_data = Rails.cache.read(cache_key)
    return cached_data if cached_data.present?

    # Si non, faire l'appel API et mettre en cache
    result = yield

    # Mettre en cache uniquement les résultats valides
    if result.present? && !(result.is_a?(Hash) && result.key?("error"))
      # Pour les données démographiques, un cache longue durée est approprié
      Rails.cache.write(cache_key, result, expires_in: 1.day)
    end

    result
  end

  def generate_cache_key(endpoint, params)
    # Digest stable entre processus et redémarrages (String#hash est aléatoire par processus)
    "api:#{endpoint}:#{Digest::SHA256.hexdigest(params.to_json)}"
  end
end
