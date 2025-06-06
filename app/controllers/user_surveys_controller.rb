# app/controllers/user_surveys_controller.rb
class UserSurveysController < ApplicationController
  include UserAuthorization
  before_action :check_can_launch_surveys
  before_action :set_user_survey, only: [:show, :edit, :update, :destroy, :results, :export_results, :close, :duplicate]

  def index
    @user_surveys = UserSurvey.accessible_by_user(current_user)
                              .includes(:survey, :user)
                              .order(created_at: :desc)

    @active_surveys = @user_surveys.active
    @upcoming_surveys = @user_surveys.upcoming
    @past_surveys = @user_surveys.past

    # Grouper les enquêtes terminées par titre d'enquête
    @past_surveys_grouped = @past_surveys.group_by { |us| us.survey.title }
                                        .transform_values { |surveys| surveys.sort_by(&:year).reverse }
  end

  def available
    @available_surveys = Survey.published
                              .where(is_template: false)
                              .where('expires_at IS NULL OR expires_at > ?', Time.current)
                              .includes(:created_by)
                              .order(title: :asc)
  end

  def compare
    @survey_title = params[:survey_title]
    return redirect_to user_surveys_path, alert: "Titre d'enquête requis" if @survey_title.blank?

    # Récupérer toutes les enquêtes de ce titre pour cet utilisateur
    @user_surveys = UserSurvey.accessible_by_user(current_user)
                              .joins(:survey)
                              .where(surveys: { title: @survey_title })
                              .where(status: :closed) # Seulement les enquêtes terminées
                              .includes(:survey, survey_responses: :question_responses)
                              .order(:year)

    return redirect_to user_surveys_path, alert: "Aucune enquête trouvée pour cette série" if @user_surveys.empty?

    @survey = @user_surveys.first.survey
    @years = @user_surveys.pluck(:year).uniq.sort

    # Calculer les statistiques de comparaison
    @comparison_data = calculate_comparison_data_for_surveys(@user_surveys)
    @response_evolution = calculate_response_evolution(@user_surveys)
  end

  def new
    @survey = Survey.find(params[:survey_id])
    unless @survey.available_for_users?
      redirect_to available_user_surveys_path, alert: "Cette enquête n'est pas disponible."
      return
    end

    @user_survey = current_user.user_surveys.build(survey: @survey)
    @user_survey.year = Date.current.year
    @user_survey.starts_at = Date.current.beginning_of_day
    @user_survey.ends_at = 1.month.from_now.end_of_day
  end

  def create
    @survey = Survey.find(params[:user_survey][:survey_id])
    @user_survey = current_user.user_surveys.build(user_survey_params)

    if @user_survey.save
      redirect_to @user_survey, notice: 'Votre enquête a été créée avec succès.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def show
    @response_count = @user_survey.survey_responses.completed.count
    @recent_responses = @user_survey.survey_responses
                                   .completed
                                   .order(completed_at: :desc)
                                   .limit(5)
  end

  def edit
    unless @user_survey.draft?
      redirect_to @user_survey, alert: "Vous ne pouvez modifier qu'une enquête en brouillon."
    end
  end

  def update
    unless @user_survey.draft?
      redirect_to @user_survey, alert: "Vous ne pouvez modifier qu'une enquête en brouillon."
      return
    end

    if @user_survey.update(user_survey_params)
      redirect_to @user_survey, notice: 'Votre enquête a été mise à jour avec succès.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    if @user_survey.draft?
      @user_survey.destroy
      redirect_to user_surveys_path, notice: 'L\'enquête a été supprimée.'
    else
      redirect_to @user_survey, alert: 'Seules les enquêtes en brouillon peuvent être supprimées.'
    end
  end

  def results
    @statistics = calculate_statistics
    @responses_by_day = @user_survey.survey_responses
                                   .completed
                                   .group_by_day(:completed_at)
                                   .count
  end

  def export_results
    respond_to do |format|
      format.csv do
        send_data export_to_csv,
                  filename: "enquete_#{@user_survey.survey.title.parameterize}_#{@user_survey.year}_#{Date.current}.csv"
      end
    end
  end

  def close
    if @user_survey.active?
      @user_survey.close!
      redirect_to @user_survey, notice: 'L\'enquête a été fermée.'
    else
      redirect_to @user_survey, alert: 'Seules les enquêtes actives peuvent être fermées.'
    end
  end

  def duplicate
    new_year = params[:year] || Date.current.year + 1
    @new_survey = @user_survey.duplicate_for_year(new_year.to_i)

    if @new_survey.persisted?
      redirect_to edit_user_survey_path(@new_survey),
                  notice: "L'enquête a été dupliquée pour l'année #{new_year}."
    else
      redirect_to @user_survey, alert: 'Erreur lors de la duplication.'
    end
  end

  private

  def check_can_launch_surveys
    unless current_user.can_launch_surveys?
      redirect_to root_path, alert: "Vous n'avez pas accès à cette fonctionnalité."
    end
  end

  def set_user_survey
    @user_survey = UserSurvey.find(params[:id])
    unless current_user.can_view_user_survey?(@user_survey)
      redirect_to user_surveys_path, alert: "Vous n'avez pas accès à cette enquête."
    end
  end

  def user_survey_params
    params.require(:user_survey).permit(:survey_id, :year, :custom_welcome_message,
                                       :custom_thank_you_message, :starts_at, :ends_at)
  end

  def calculate_comparison_data_for_surveys(user_surveys)
    comparison_data = {
      questions: {}
    }

    # Pour chaque question de l'enquête
    user_surveys.first.survey.questions.each do |question|
      comparison_data[:questions][question.id] = {
        title: question.title,
        type: question.question_type,
        data: {}
      }

      # Pour chaque année
      user_surveys.each do |user_survey|
        year = user_survey.year
        completed_responses = user_survey.survey_responses.completed

        question_responses = completed_responses.joins(:question_responses)
                                              .where(question_responses: { question: question })
                                              .where.not(question_responses: { answer_text: [nil, ''] })

        case question.question_type
        when 'single_choice', 'yes_no'
          year_stats = question_responses.joins(:question_responses)
                                       .group('question_responses.answer_text')
                                       .count
          total = year_stats.values.sum

          # Calculer les pourcentages
          percentages = {}
          year_stats.each do |answer, count|
            percentages[answer] = total > 0 ? (count.to_f / total * 100).round(1) : 0
          end

          comparison_data[:questions][question.id][:data][year] = {
            counts: year_stats,
            percentages: percentages,
            total: total
          }

        when 'scale', 'numeric'
          values = question_responses.joins(:question_responses)
                                   .pluck('question_responses.answer_text')
                                   .map(&:to_f)
                                   .reject(&:zero?)

          if values.any?
            comparison_data[:questions][question.id][:data][year] = {
              average: (values.sum / values.count.to_f).round(2),
              count: values.count,
              min: values.min,
              max: values.max,
              median: calculate_median(values)
            }
          end

        when 'multiple_choice'
          all_answers = question_responses.joins(:question_responses)
                                        .pluck('question_responses.answer_data')
          answer_counts = Hash.new(0)
          all_answers.each do |answers_array|
            next unless answers_array.is_a?(Array)
            answers_array.each { |answer| answer_counts[answer] += 1 }
          end

          total_responses = user_survey.response_count
          percentages = {}
          answer_counts.each do |answer, count|
            percentages[answer] = total_responses > 0 ? (count.to_f / total_responses * 100).round(1) : 0
          end

          comparison_data[:questions][question.id][:data][year] = {
            counts: answer_counts,
            percentages: percentages,
            total_responses: total_responses
          }
        end
      end
    end

    comparison_data
  end

  def calculate_response_evolution(user_surveys)
    user_surveys.map do |user_survey|
      {
        year: user_survey.year,
        response_count: user_survey.response_count,
        duration_days: (user_survey.ends_at.to_date - user_survey.starts_at.to_date).to_i,
        completion_rate: calculate_completion_rate(user_survey)
      }
    end
  end

  def calculate_completion_rate(user_survey)
    total_started = user_survey.survey_responses.count
    completed = user_survey.survey_responses.completed.count
    return 0 if total_started.zero?
    (completed.to_f / total_started * 100).round(1)
  end

  def calculate_median(values)
    return 0 if values.empty?
    sorted = values.sort
    len = sorted.length
    return sorted[len / 2] if len.odd?
    (sorted[(len - 1) / 2] + sorted[len / 2]) / 2.0
  end

  def calculate_statistics
    responses = @user_survey.survey_responses.completed
    stats = {}

    @user_survey.survey.questions.each do |question|
      question_responses = responses.joins(:question_responses)
                                  .where(question_responses: { question: question })
                                  .where.not(question_responses: { answer_text: [nil, ''] })

      case question.question_type
      when 'single_choice', 'yes_no'
        stats[question.id] = question_responses.joins(:question_responses)
                                             .group('question_responses.answer_text')
                                             .count
      when 'multiple_choice'
        all_answers = question_responses.joins(:question_responses)
                                      .pluck('question_responses.answer_data')
        answer_counts = Hash.new(0)
        all_answers.each do |answers_array|
          next unless answers_array.is_a?(Array)
          answers_array.each { |answer| answer_counts[answer] += 1 }
        end
        stats[question.id] = answer_counts
      when 'scale', 'numeric'
        values = question_responses.joins(:question_responses)
                                 .pluck('question_responses.answer_text')
                                 .map(&:to_f)
                                 .reject(&:zero?)
        if values.any?
          stats[question.id] = {
            average: (values.sum / values.count.to_f).round(2),
            min: values.min,
            max: values.max,
            count: values.count,
            distribution: values.group_by(&:itself).transform_values(&:count)
          }
        end
      else
        stats[question.id] = {
          total_responses: question_responses.count,
          sample_responses: question_responses.joins(:question_responses)
                                            .limit(5)
                                            .pluck('question_responses.answer_text')
                                            .compact
                                            .reject(&:blank?)
        }
      end
    end

    stats
  end

  def export_to_csv
    require 'csv'

    CSV.generate(headers: true) do |csv|
      headers = ['ID Réponse', 'Date de début', 'Date de fin', 'Durée (minutes)']
      @user_survey.survey.questions.each { |q| headers << q.title }
      csv << headers

      @user_survey.survey_responses.completed.includes(:question_responses).find_each do |response|
        duration = ((response.completed_at - response.started_at) / 60).round if response.completed_at && response.started_at

        row = [
          response.id,
          response.started_at&.strftime('%d/%m/%Y %H:%M'),
          response.completed_at&.strftime('%d/%m/%Y %H:%M'),
          duration
        ]

        @user_survey.survey.questions.each do |question|
          answer = response.answer_for(question)
          row << (answer&.answer || '')
        end

        csv << row
      end
    end
  end
end
