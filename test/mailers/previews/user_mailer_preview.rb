# Aperçu des e-mails en local : http://localhost:3000/rails/mailers/user_mailer
class UserMailerPreview < ActionMailer::Preview
  def welcome_new_user
    user = User.where.not(territory_code: nil).first || User.first
    UserMailer.welcome_new_user(user, "Exemple-Mdp-2026!")
  end

  def password_setup_reminder
    user = User.where.not(territory_code: nil).first || User.first
    UserMailer.password_setup_reminder(user)
  end
end
