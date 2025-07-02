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
                  filename: "enquete_#{@user_survey.survey.title.parameterize}_#{@user_survey.year}_#{Date.current}.csv",
                  type: 'text/csv; charset=utf-8',
                  disposition: 'attachment'
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
      if current_user.suspended?
        redirect_to suspended_account_path
      else
        redirect_to root_path, alert: "Vous n'avez pas accès à cette fonctionnalité."
      end
    end
  end

  def set_user_survey
    @user_survey = UserSurvey.find(params[:id])
    unless current_user.can_view_user_survey?(@user_survey)
      if current_user.suspended?
        redirect_to suspended_account_path
      else
        redirect_to user_surveys_path, alert: "Vous n'avez pas accès à cette enquête."
      end
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

        when 'weekly_schedule'
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
    # IMPORTANT: Ne récupérer que les réponses de CETTE user_survey spécifique
    responses = @user_survey.survey_responses.completed
    stats = {}

    @user_survey.survey.questions.each do |question|
      # Récupérer les question_responses liées aux survey_responses de cette user_survey uniquement
      question_responses = QuestionResponse.joins(:survey_response)
                                          .where(survey_responses: {
                                            id: responses.pluck(:id),
                                            completed: true
                                          })
                                          .where(question: question)

      case question.question_type
      when 'commune_location'
        commune_stats = {}
        other_communes_detail = {} # Pour garder le détail des noms
        other_communes_count = 0   # Pour compter toutes les "autres"

        question_responses.each do |qr|
          if qr.answer_data.present? && qr.answer_data.is_a?(Hash)
            data = qr.answer_data
            if data['type'] == 'commune'
              # C'est une commune connue du territoire
              key = data['commune_name'] || data['commune_code']
              commune_stats[key] ||= 0
              commune_stats[key] += 1
            elsif data['type'] == 'other'
              # C'est une autre commune - on compte dans le total "autres"
              other_communes_count += 1

              # Et on garde le détail si le nom est renseigné
              if data['commune_name'].present?
                other_communes_detail[data['commune_name']] ||= 0
                other_communes_detail[data['commune_name']] += 1
              else
                # Commune autre sans nom précisé
                other_communes_detail['Non précisé'] ||= 0
                other_communes_detail['Non précisé'] += 1
              end
            end
          elsif qr.answer_text.present?
            # Fallback pour les anciennes données
            if qr.answer_text == 'other'
              other_communes_count += 1
              other_communes_detail['Non précisé'] ||= 0
              other_communes_detail['Non précisé'] += 1
            else
              # C'est probablement un code INSEE, essayer de trouver la commune
              territory = Territory.find_by(codgeo: qr.answer_text)
              key = territory&.libgeo || qr.answer_text
              commune_stats[key] ||= 0
              commune_stats[key] += 1
            end
          end
        end

        # Ajouter le total des autres communes comme une seule entrée
        if other_communes_count > 0
          commune_stats['Autres communes'] = other_communes_count
        end

        # Ajouter les détails des autres communes dans une clé spéciale
        if other_communes_detail.any?
          commune_stats['_autres_detail'] = other_communes_detail
        end

        stats[question.id] = commune_stats

      when 'single_choice', 'yes_no'
        stats[question.id] = question_responses.where.not(answer_text: [nil, ''])
                                              .group(:answer_text)
                                              .count

      when 'ranking'
        # Récupérer toutes les réponses de ranking
        raw_rankings = question_responses.pluck(:answer_data)
                                        .compact
                                        .select { |data| data.is_a?(Array) }

        # Parser correctement les données (gestion du double-encodage JSON)
        all_rankings = []
        raw_rankings.each do |raw_ranking|
          if raw_ranking.is_a?(Array) && raw_ranking.length == 1 && raw_ranking[0].is_a?(String)
            # Cas de double-encodage JSON : ["[\"option1\",\"option2\"]"]
            begin
              parsed_ranking = JSON.parse(raw_ranking[0])
              all_rankings << parsed_ranking if parsed_ranking.is_a?(Array)
            rescue JSON::ParserError
              Rails.logger.warn "Erreur parsing JSON pour ranking: #{raw_ranking[0]}"
            end
          elsif raw_ranking.is_a?(Array) && raw_ranking.all? { |item| item.is_a?(String) }
            # Cas normal : ["option1", "option2"]
            all_rankings << raw_ranking
          end
        end

        if all_rankings.any?
          # Calculer le score moyen pour chaque option
          option_scores = {}
          option_counts = {}

          question.question_options.each do |option|
            option_scores[option.value] = []
            option_counts[option.value] = 0
          end

          all_rankings.each do |ranking|
            ranking.each_with_index do |option_value, index|
              position = index + 1 # Position 1 = meilleur rang

              if option_scores.key?(option_value)
                option_scores[option_value] << position
                option_counts[option_value] += 1
              end
            end
          end

          # Calculer les moyennes
          average_rankings = {}
          option_scores.each do |option_value, positions|
            if positions.any?
              average_rankings[option_value] = positions.sum.to_f / positions.count
            else
              average_rankings[option_value] = 999
            end
          end

          # Trier par meilleur score moyen (plus bas = mieux)
          sorted_options = average_rankings.sort_by { |_, avg| avg }

          stats[question.id] = {
            type: 'ranking',
            total_responses: all_rankings.count,
            average_rankings: average_rankings,
            sorted_options: sorted_options,
            option_counts: option_counts
          }
        else
          stats[question.id] = { type: 'ranking', total_responses: 0 }
        end

      when 'multiple_choice'
        all_answers = question_responses.pluck(:answer_data)
        answer_counts = Hash.new(0)
        all_answers.each do |answers_array|
          next unless answers_array.is_a?(Array)
          answers_array.each { |answer| answer_counts[answer] += 1 }
        end
        stats[question.id] = answer_counts

      when 'weekly_schedule'
        all_answers = question_responses.pluck(:answer_data)
        answer_counts = Hash.new(0)
        all_answers.each do |answers_array|
          next unless answers_array.is_a?(Array)
          answers_array.each { |answer| answer_counts[answer] += 1 }
        end
        stats[question.id] = answer_counts

      when 'scale', 'numeric'
        values = question_responses.where.not(answer_text: [nil, ''])
                                  .pluck(:answer_text)
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
        # Questions texte
        stats[question.id] = {
          total_responses: question_responses.where.not(answer_text: [nil, '']).count,
          sample_responses: question_responses.where.not(answer_text: [nil, ''])
                                            .limit(5)
                                            .pluck(:answer_text)
        }
      end
    end

    stats
  end

  def position_to_french(position)
    case position
    when 1
      "1er"
    when 2
      "2e"
    else
      "#{position}e"
    end
  end

  def export_to_csv
    require 'csv'

    CSV.generate(headers: true, encoding: 'UTF-8', force_quotes: true) do |csv|
      headers = ['ID Réponse', 'Date de début', 'Date de fin', 'Durée (minutes)']

      # Ajouter les en-têtes de questions
      @user_survey.survey.questions.each do |q|
        case q.question_type
        when 'ranking'
          # Pour les questions de ranking, créer une colonne par position
          (1..q.question_options.count).each do |position|
            headers << "#{q.title} - #{position_to_french(position)}"
          end
        when 'commune_location'
          headers << q.title
          headers << "Nom des autres communes"
        else
          headers << q.title
        end
      end

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

          case question.question_type
          when 'ranking'
            # Traiter les réponses de ranking
            if answer&.answer_data&.is_a?(Array)
              # Parser les données (gestion du double-encodage)
              ranking_data = if answer.answer_data.length == 1 && answer.answer_data[0].is_a?(String)
                begin
                  JSON.parse(answer.answer_data[0])
                rescue JSON::ParserError
                  []
                end
              else
                answer.answer_data
              end

              # Créer un tableau ordonné des réponses
              ordered_responses = Array.new(question.question_options.count, '')

              ranking_data.each_with_index do |option_value, index|
                if index < ordered_responses.length
                  # Trouver le texte de l'option
                  option = question.question_options.find { |opt| opt.value == option_value }
                  ordered_responses[index] = option&.text || option_value
                end
              end

              # Ajouter chaque position à la ligne
              ordered_responses.each { |text| row << text }
            else
              # Si pas de réponse, ajouter des colonnes vides
              question.question_options.count.times { row << '' }
            end

          when 'commune_location'
            # Code existant pour commune_location
            if answer&.answer_data&.is_a?(Hash) && answer.answer_data['type'] == 'other'
              row << "Autre commune"
              commune_name = answer.answer_data['commune_name']
              row << (commune_name.present? ? commune_name : '')
            elsif answer&.answer_text == 'other'
              row << "Autre commune"
              row << ''
            else
              row << (answer&.formatted_answer || '')
              row << ''
            end

          when 'weekly_schedule'
            # Code existant pour weekly_schedule
            if answer&.answer_data&.is_a?(Array) && answer.answer_data.any?
              readable_answers = answer.answer_data.map do |value|
                day, time_slot = value.split('_', 2)
                time_slot_readable = time_slot.humanize.gsub(/_/, ' ')
                "#{day}: #{time_slot_readable}"
              end
              row << readable_answers.join(' | ')
            else
              row << 'Aucun créneau sélectionné'
            end

          else
            # Autres types de questions
            row << (answer&.formatted_answer || '')
          end
        end

        csv << row
      end
    end
  end
end
