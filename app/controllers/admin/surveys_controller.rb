# app/controllers/admin/surveys_controller.rb
class Admin::SurveysController < ApplicationController
  include UserAuthorization
  before_action :set_survey, only: [:show, :edit, :update, :destroy, :publish, :unpublish, :preview, :duplicate, :results, :export_results]

  def requires_super_admin?
    true
  end

  def index
    @surveys = Survey.includes(:created_by, :survey_sections)
                    .where(is_template: false)
                    .order(created_at: :desc)
    @templates = Survey.templates.includes(:created_by).order(:title)
  end

  def show
    @sections = @survey.survey_sections.includes(questions: :question_options)
    @response_count = @survey.response_count
  end

  def new
    @survey = Survey.new
    @templates = Survey.templates.order(:title)
  end

  def create
    @survey = Survey.new(survey_params)
    @survey.created_by = current_user

    if params[:template_id].present?
      template = Survey.templates.find(params[:template_id])
      @survey = create_from_template(template)
    end

    if @survey.save
      redirect_to admin_survey_path(@survey), notice: 'Enquête créée avec succès.'
    else
      @templates = Survey.templates.order(:title)
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @survey.update(survey_params)
      redirect_to admin_survey_path(@survey), notice: 'Enquête mise à jour avec succès.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @survey.destroy
    redirect_to admin_surveys_path, notice: 'Enquête supprimée avec succès.'
  end

  def publish
    if @survey.survey_sections.any? && @survey.total_questions > 0
      @survey.publish!
      redirect_to admin_survey_path(@survey), notice: 'Enquête publiée avec succès.'
    else
      redirect_to admin_survey_path(@survey), alert: 'Impossible de publier une enquête sans questions.'
    end
  end

  def unpublish
    @survey.close!
    redirect_to admin_survey_path(@survey), notice: 'Enquête fermée avec succès.'
  end

  def preview
    @sections = @survey.survey_sections.includes(questions: :question_options)
    render layout: 'survey_preview'
  end

  def duplicate
    new_survey = @survey.duplicate_as_template
    redirect_to admin_survey_path(new_survey), notice: 'Modèle créé à partir de cette enquête.'
  end

  def results
    @responses = @survey.survey_responses.completed.includes(:user, question_responses: :question)
    @statistics = calculate_statistics
  end

  def export_results
    respond_to do |format|
      format.csv do
        send_data export_to_csv, filename: "enquete_#{@survey.id}_resultats_#{Date.current}.csv"
      end
    end
  end

  private

  def set_survey
    @survey = Survey.find(params[:id])
  end

  def survey_params
    params.require(:survey).permit(:title, :description, :is_template, :welcome_message,
                                  :thank_you_message, :allow_anonymous, :show_progress_bar,
                                  :expires_at, settings: {})
  end

  def create_from_template(template)
    new_survey = template.dup
    new_survey.is_template = false
    new_survey.published = false
    new_survey.created_by = current_user
    new_survey.title = survey_params[:title] || "#{template.title} - Copie"

    new_survey.save!

    template.survey_sections.each do |section|
      new_section = section.dup
      new_section.survey = new_survey
      new_section.save!

      section.questions.each do |question|
        new_question = question.dup
        new_question.survey_section = new_section
        new_question.save!

        question.question_options.each do |option|
          new_option = option.dup
          new_option.question = new_question
          new_option.save!
        end
      end
    end

    new_survey
  end

  def calculate_statistics
    stats = {}

    @survey.questions.each do |question|
      responses = @responses.joins(:question_responses)
                           .where(question_responses: { question: question })
                           .where.not(question_responses: { answer_text: nil })

      case question.question_type
      when 'single_choice', 'yes_no'
        stats[question.id] = responses.group('question_responses.answer_text').count
      when 'multiple_choice'
        # Analyser les réponses multiples
        all_answers = responses.joins(:question_responses)
                              .where(question_responses: { question: question })
                              .pluck('question_responses.answer_data')

        answer_counts = Hash.new(0)
        all_answers.each do |answers_array|
          next unless answers_array.is_a?(Array)
          answers_array.each { |answer| answer_counts[answer] += 1 }
        end
        stats[question.id] = answer_counts
      when 'scale', 'numeric'
        values = responses.joins(:question_responses)
                         .where(question_responses: { question: question })
                         .pluck('question_responses.answer_text')
                         .map(&:to_f)

        if values.any?
          stats[question.id] = {
            average: (values.sum / values.count.to_f).round(2),
            min: values.min,
            max: values.max,
            count: values.count
          }
        end
      else
        stats[question.id] = { total_responses: responses.count }
      end
    end

    stats
  end

  def export_to_csv
    require 'csv'

    CSV.generate(headers: true) do |csv|
      # En-têtes
      headers = ['ID Réponse', 'Utilisateur', 'Date de début', 'Date de fin', 'Complété']
      @survey.questions.each { |q| headers << q.title }
      csv << headers

      # Données
      @responses.each do |response|
        row = [
          response.id,
          response.user&.email || 'Anonyme',
          response.started_at&.strftime('%d/%m/%Y %H:%M'),
          response.completed_at&.strftime('%d/%m/%Y %H:%M'),
          response.completed? ? 'Oui' : 'Non'
        ]

        @survey.questions.each do |question|
          answer = response.answer_for(question)
          row << (answer ? answer.answer : '')
        end

        csv << row
      end
    end
  end
end
