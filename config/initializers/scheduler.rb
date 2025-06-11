# Configuration pour les tâches programmées
Rails.application.config.after_initialize do
  # Programmer le job de rappel pour la configuration des mots de passe
  # Exécuter tous les jours à 10h00
  if Rails.env.production?
    # En production, utilisez un scheduler comme cron ou whenever
    # Exemple de tâche cron à ajouter :
    # 0 10 * * * cd /path/to/your/app && bundle exec rails runner "PasswordSetupReminderJob.perform_now"
  elsif Rails.env.development?
    # En développement, vous pouvez tester manuellement avec :
    # PasswordSetupReminderJob.perform_now
  end
end
