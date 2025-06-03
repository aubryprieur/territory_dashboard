class UserSurveyPolicy
  attr_reader :user, :user_survey

  def initialize(user, user_survey)
    @user = user
    @user_survey = user_survey
  end

  def index?
    user.can_launch_surveys?
  end

  def available?
    user.can_launch_surveys?
  end

  def new?
    user.can_launch_surveys?
  end

  def create?
    user.can_launch_surveys?
  end

  def show?
    user.can_view_user_survey?(user_survey)
  end

  def edit?
    owner? && user_survey.draft?
  end

  def update?
    edit?
  end

  def destroy?
    owner? && user_survey.draft?
  end

  def results?
    show?
  end

  def export_results?
    show?
  end

  def close?
    owner? && user_survey.active?
  end

  def duplicate?
    show?
  end

  private

  def owner?
    user_survey.user_id == user.id
  end
end
