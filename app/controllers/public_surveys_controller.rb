class PublicSurveysController < ApplicationController
  before_action :set_user_survey_by_token
  before_action :check_survey_active, except: [:thank_you]
  layout 'public_survey'

  def show
    @survey = @user_survey.survey
    @sections = @survey.survey_sections.includes(questions: :question_options)

    # Créer ou récupérer la réponse en cours
    @survey_response = find_or_create_response
  end

  def submit_section
    @survey_response = find_response
    section = @user_survey.survey.survey_sections.find(params[:section_id])

    # Sauvegarder les réponses de la section
    if save_section_responses(section)
      next_section = @user_survey.survey.survey_sections
                                        .where('position > ?', section.position)
                                        .order(:position)
                                        .first

      if next_section
        redirect_to public_survey_path(@user_survey.public_token, section: next_section.id)
      else
        # Dernière section, marquer comme complété
        @survey_response.complete!
        @user_survey.increment!(:response_count)
        redirect_to thank_you_public_survey_path(@user_survey.public_token)
      end
    else
      @survey = @user_survey.survey
      @sections = @survey.survey_sections.includes(questions: :question_options)
      @current_section = section
      render :show, status: :unprocessable_entity
    end
  end

  def thank_you
    @survey = @user_survey.survey
  end

  private

  def set_user_survey_by_token
    @user_survey = UserSurvey.find_by!(public_token: params[:token])
  rescue ActiveRecord::RecordNotFound
    render_404
  end

  def check_survey_active
    unless @user_survey.can_receive_responses?
      render 'survey_closed', status: :forbidden
    end
  end

  def find_or_create_response
    session_id = session[:survey_response_id] || SecureRandom.hex(16)
    session[:survey_response_id] = session_id

    @user_survey.survey_responses.find_or_create_by(
      session_id: session_id,
      survey: @user_survey.survey
    ) do |response|
      response.started_at = Time.current
      response.ip_address = request.remote_ip
      response.user_agent = request.user_agent
    end
  end

  def find_response
    session_id = session[:survey_response_id]
    @user_survey.survey_responses.find_by!(session_id: session_id)
  end

  def save_section_responses(section)
    return false unless params[:responses].present?

    errors = []

    section.questions.each do |question|
      response_value = params[:responses][question.id.to_s]

      # Vérifier si la question est obligatoire
      if question.required? && response_value.blank?
        errors << "La question '#{question.title}' est obligatoire"
        next
      end

      next if response_value.blank?

      # Créer ou mettre à jour la réponse
      question_response = @survey_response.question_responses
                                        .find_or_initialize_by(question: question)

      case question.question_type
      when 'multiple_choice'
        question_response.answer = response_value.values.select(&:present?)
      else
        question_response.answer = response_value
      end

      unless question_response.save
        errors << "Erreur pour la question '#{question.title}'"
      end
    end

    if errors.any?
      flash.now[:alert] = errors.join(', ')
      false
    else
      true
    end
  end

  def render_404
    render file: Rails.root.join('public', '404.html'), status: :not_found, layout: false
  end
end
