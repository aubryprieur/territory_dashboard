class PasswordSetupReminderJob < ApplicationJob
  queue_as :default

  def perform
    # Trouver les utilisateurs qui n'ont pas configuré leur mot de passe
    # et dont l'email de confirmation a été envoyé il y a plus de 24h
    users_to_remind = User.where(password_set: false)
                         .where.not(confirmation_sent_at: nil)
                         .where(confirmed_at: nil)
                         .where('confirmation_sent_at < ?', 24.hours.ago)
                         .where('confirmation_sent_at > ?', 6.days.ago) # Pas encore expirés

    users_to_remind.find_each do |user|
      # Éviter d'envoyer trop de rappels
      last_reminder = user.confirmation_sent_at

      # Envoyer un rappel tous les 2 jours maximum
      if last_reminder.nil? || last_reminder < 2.days.ago
        UserMailer.password_setup_reminder(user).deliver_now
        Rails.logger.info "Rappel de configuration de mot de passe envoyé à #{user.email}"
      end
    end

    # Supprimer les comptes non confirmés après expiration
    expired_users = User.where(password_set: false)
                       .where.not(confirmation_sent_at: nil)
                       .where(confirmed_at: nil)
                       .where('confirmation_sent_at < ?', Devise.confirm_within.ago)

    expired_count = expired_users.count
    expired_users.destroy_all

    if expired_count > 0
      Rails.logger.info "#{expired_count} compte(s) expiré(s) supprimé(s)"
    end
  end
end
