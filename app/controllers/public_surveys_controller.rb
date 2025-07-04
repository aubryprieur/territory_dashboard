class PublicSurveysController < ApplicationController
  before_action :set_user_survey_by_token
  before_action :check_survey_active, except: [:thank_you]
  layout 'public_survey'

  def show
    @survey = @user_survey.survey
    @sections = @survey.survey_sections.includes(questions: :question_options)

    # Déterminer la section courante
    if params[:section].present?
      @current_section = @sections.find { |s| s.id.to_s == params[:section] }
      @current_section ||= @sections.first # Fallback si section non trouvée
    else
      @current_section = @sections.first
    end

    # Calculer l'index de la section courante
    @current_section_index = @sections.index(@current_section) || 0

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

      # Recalculer les variables pour le rendu en cas d'erreur
      @current_section = section
      @current_section_index = @sections.index(@current_section) || 0

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
    # Générer un nouveau session_id à chaque fois pour permettre les réponses multiples
    session_id = SecureRandom.hex(16)
    session[:survey_response_id] = session_id

    # Créer toujours une nouvelle réponse
    @user_survey.survey_responses.create!(
      session_id: session_id,
      survey: @user_survey.survey,
      started_at: Time.current,
      ip_address: request.remote_ip,
      user_agent: request.user_agent
    )
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

      # Gérer le cas spécial de commune_location avec "other"
      if question.commune_location_question? && response_value == 'other'
        other_value = params[:responses]["#{question.id}_other"]
        if other_value.blank? && question.required?
          errors << "Veuillez préciser votre commune"
          next
        end
      end

      # Gérer les questions avec option "autre" (single_choice et multiple_choice)
      if question.supports_other_option? && question.has_other_option?
        other_text_key = "#{question.id}_other_text"
        other_text = params[:responses][other_text_key]

        # Vérifier si "other" est sélectionné mais sans texte
        if question.single_choice? && response_value == 'other' && other_text.blank? && question.required?
          errors << "Veuillez préciser votre réponse pour '#{question.title}'"
          next
        elsif question.multiple_choice? && response_value.is_a?(Array) && response_value.include?('other') && other_text.blank? && question.required?
          errors << "Veuillez préciser votre réponse pour '#{question.title}'"
          next
        end
      end

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
      when 'single_choice'
        if question.has_other_option? && response_value == 'other'
          other_text = params[:responses]["#{question.id}_other_text"]
          question_response.answer_text = 'other'
          question_response.answer_data = {
            'type' => 'other',
            'text' => other_text
          }
        else
          question_response.answer_text = response_value
          question_response.answer_data = nil
        end
      when 'multiple_choice'
        clean_values = response_value.is_a?(Array) ? response_value.select(&:present?) : [response_value].compact

        if question.has_other_option? && clean_values.include?('other')
          other_text = params[:responses]["#{question.id}_other_text"]
          # Traiter les réponses en remplaçant 'other' par l'objet avec le texte
          processed_values = clean_values.map do |value|
            if value == 'other'
              { 'type' => 'other', 'text' => other_text }
            else
              value
            end
          end
          question_response.answer_data = processed_values
          question_response.answer_text = processed_values.map { |v| v.is_a?(Hash) ? 'other' : v }.join(', ')
        else
          question_response.answer_data = clean_values
          question_response.answer_text = clean_values.join(', ')
        end
      when 'weekly_schedule'
        # Pour weekly_schedule, traiter de la même façon que multiple_choice (sans option autre)
        clean_values = response_value.is_a?(Array) ? response_value.select(&:present?) : [response_value].compact
        question_response.answer_data = clean_values
        question_response.answer_text = clean_values.join(', ')
      when 'commune_location'
        Rails.logger.info "===== COMMUNE LOCATION DEBUG ====="
        Rails.logger.info "response_value: #{response_value}"
        Rails.logger.info "other value: #{params[:responses]["#{question.id}_other"]}"
        Rails.logger.info "all params: #{params[:responses].inspect}"

        # Traitement spécial pour commune_location
        if response_value == 'other'
          other_commune = params[:responses]["#{question.id}_other"]
          question_response.answer_text = 'other'
          question_response.answer_data = {
            'type' => 'other',
            'commune_code' => 'other',
            'commune_name' => other_commune  # Stocker la valeur saisie
          }
        else
          # C'est un code INSEE
          territory = Territory.find_by(codgeo: response_value)
          question_response.answer_text = response_value
          question_response.answer_data = {
            'type' => 'commune',
            'commune_code' => response_value,
            'commune_name' => territory&.libgeo || response_value
          }
        end
      else
        question_response.answer = response_value
      end

      unless question_response.save
        errors << "Erreur pour la question '#{question.title}'"
        Rails.logger.error "Erreur sauvegarde question_response: #{question_response.errors.full_messages}"
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
