class SuspendedAccountsController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_user_suspended

  def show
    @suspension_reason = current_user.suspension_reason || "Défaut de paiement"
    @suspended_since = current_user.suspended_at
    @suspension_duration = current_user.suspension_duration_in_days
  end

  private

  def ensure_user_suspended
    unless current_user.suspended?
      redirect_to root_path
    end
  end
end
