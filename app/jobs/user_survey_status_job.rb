# app/jobs/user_survey_status_job.rb
class UserSurveyStatusJob < ApplicationJob
  queue_as :default

  def perform
    # Activer les enquêtes qui doivent démarrer
    UserSurvey.draft.where('starts_at <= ?', Time.current).find_each do |survey|
      survey.activate!
      Rails.logger.info "Activated UserSurvey ##{survey.id}"
    end

    # Fermer les enquêtes qui sont terminées
    UserSurvey.active.where('ends_at < ?', Time.current).find_each do |survey|
      survey.close!
      Rails.logger.info "Closed UserSurvey ##{survey.id}"
    end
  end
end

# Ajouter dans config/initializers/scheduler.rb ou utiliser whenever gem
# Pour exécuter toutes les heures :
# UserSurveyStatusJob.perform_later
