# app/controllers/admin/questions_controller.rb
class Admin::QuestionsController < ApplicationController
  include UserAuthorization
  before_action :set_survey_and_section
  before_action :set_question, only: [:edit, :update, :destroy]
  before_action :check_survey_not_published

  def requires_super_admin?
    true
  end

  def new
    @question = @section.questions.build
  end

  def create
    @question = @section.questions.build(question_params)

    # Traiter les options pour les questions à échelle
    if @question.question_type == 'scale'
      process_scale_options
    end

    if @question.save
      if params[:commit] == "Créer et ajouter une autre"
        redirect_to new_admin_survey_survey_section_question_path(@survey, @section), notice: "Question créée. Vous pouvez en ajouter une autre."
      else
        redirect_to admin_survey_path(@survey), notice: "La question a été créée avec succès."
      end
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    # Traiter les options pour les questions à échelle
    if question_params[:question_type] == 'scale'
      process_scale_options
    end

    if @question.update(question_params)
      redirect_to admin_survey_path(@survey), notice: "La question a été mise à jour avec succès."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @question.destroy
    redirect_to admin_survey_path(@survey), notice: "La question a été supprimée avec succès."
  end

  private

  def set_survey_and_section
    @survey = Survey.find(params[:survey_id])
    @section = @survey.survey_sections.find(params[:survey_section_id])
  end

  def set_question
    @question = @section.questions.find(params[:id])
  end

  def question_params
    params.require(:question).permit(:title, :description, :question_type, :required,
                                    question_options_attributes: [:id, :text, :value, :position, :_destroy])
  end

  def check_survey_not_published
    if @survey.published?
      redirect_to admin_survey_path(@survey), alert: "Cette enquête est publiée et ne peut plus être modifiée."
    end
  end

  def process_scale_options
    # Récupérer les paramètres de l'échelle depuis les params
    scale_min = params[:scale_min]&.to_i || 1
    scale_max = params[:scale_max]&.to_i || 5
    scale_step = params[:scale_step]&.to_i || 1
    scale_min_label = params[:scale_min_label]
    scale_max_label = params[:scale_max_label]

    # Sauvegarder les configurations de l'échelle
    @question.options ||= {}
    @question.options['scale_min'] = scale_min
    @question.options['scale_max'] = scale_max
    @question.options['scale_step'] = scale_step
    @question.options['scale_min_label'] = scale_min_label if scale_min_label.present?
    @question.options['scale_max_label'] = scale_max_label if scale_max_label.present?

    # Supprimer les options existantes
    @question.question_options.destroy_all if @question.persisted?

    # Créer les nouvelles options de l'échelle
    position = 1
    (scale_min..scale_max).step(scale_step) do |value|
      @question.question_options.build(
        text: value.to_s,
        value: value.to_s,
        position: position
      )
      position += 1
    end
  end
end
