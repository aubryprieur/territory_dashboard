class ApiAuthService
  def initialize
    @base_url = Rails.application.config.api[:base_url]
    @username = Rails.application.config.api[:username]
    @password = Rails.application.config.api[:password]
    @token = nil
    @token_expiry = nil
  end

  def get_token
    if @token.nil? || token_expired?
      refresh_token
    end
    @token
  end

  private

  def refresh_token
    response = HTTP.post("#{@base_url}/token", form: {
      username: @username,
      password: @password
    })

    if response.status.success?
      data = JSON.parse(response.body.to_s)
      @token = data["access_token"]
      @token_expiry = Time.now + 30.minutes # À ajuster selon la durée de validité de votre token
    else
      Rails.logger.error("Failed to get API token: #{response.status}")
      nil
    end
  end

  def token_expired?
    @token_expiry.nil? || @token_expiry < Time.now
  end
end
