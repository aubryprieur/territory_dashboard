module UserAuthorization
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
    before_action :check_super_admin, if: :requires_super_admin?
  end

  private

  def check_super_admin
    unless current_user.super_admin?
      flash[:alert] = "Vous n'avez pas accès à cette fonctionnalité."
      redirect_to root_path
    end
  end

  def requires_super_admin?
    false
  end
end
