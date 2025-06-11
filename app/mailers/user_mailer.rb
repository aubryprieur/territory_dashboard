class UserMailer < ApplicationMailer
  default from: 'noreply@territory-dashboard.fr'

  def welcome_new_user(user, temporary_password)
    @user = user
    @temporary_password = temporary_password
    @login_url = user_session_url
    @territory_type = @user.territory_type&.humanize
    @territory_name = @user.territory_name

    mail(
      to: @user.email,
      subject: 'Bienvenue sur Territory Dashboard - Configurez votre mot de passe'
    )
  end

  def password_setup_reminder(user)
    @user = user
    @setup_url = edit_user_registration_url
    @days_remaining = days_until_expiry(user)

    mail(
      to: @user.email,
      subject: 'Rappel : Configurez votre mot de passe - Territory Dashboard'
    )
  end

  private

  def days_until_expiry(user)
    return 0 unless user.confirmation_sent_at

    expiry_date = user.confirmation_sent_at + Devise.confirm_within
    days = ((expiry_date - Time.current) / 1.day).ceil
    [days, 0].max
  end
end
