# app/controllers/admin/survey_sections_controller.rb
class Admin::SurveySectionsController < ApplicationController
  include UserAuthorization
  before_action :set_survey
  before_action :set_section, only: [:edit, :update, :destroy]

  def requires_super_admin?
    true
  end

  def new
    @section = @survey.survey_sections.build
  end

  def create
    @section = @survey.survey_sections.build(section_params)

    if @section.save
      redirect_to admin_survey_path(@survey), notice: 'Section créée avec succès.'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @section.update(section_params)
      redirect_to admin_survey_path(@survey), notice: 'Section mise à jour avec succès.'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @section.destroy
    redirect_to admin_survey_path(@survey), notice: 'Section supprimée avec succès.'
  end

  private

  def set_survey
    @survey = Survey.find(params[:survey_id])
  end

  def set_section
    @section = @survey.survey_sections.find(params[:id])
  end

  def section_params
    params.require(:survey_section).permit(:title, :description, :required)
  end
end
