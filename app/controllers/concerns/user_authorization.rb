module UserAuthorization
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!
    before_action :check_super_admin, if: :requires_super_admin?
    before_action :check_user_not_suspended, unless: :skip_suspension_check_for_action?
  end

  private

  def check_super_admin
    unless current_user.super_admin?
      flash[:alert] = "Vous n'avez pas accès à cette fonctionnalité."
      redirect_to root_path
    end
  end

  def check_user_not_suspended
    if current_user.suspended? && !current_user.super_admin?
      redirect_to suspended_account_path
    end
  end

  def requires_super_admin?
    false
  end

  def skip_suspension_check_for_action?
    # Les super admins peuvent toujours accéder même si suspendus (ce qui ne devrait pas arriver)
    current_user.super_admin?
  end
end
