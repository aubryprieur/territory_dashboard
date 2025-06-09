module SuspensionCheck
  extend ActiveSupport::Concern

  included do
    before_action :check_user_suspension, unless: :skip_suspension_check?
  end

  private

  def check_user_suspension
    return unless user_signed_in?
    return if current_user.super_admin?
    return if controller_name == 'sessions' # Permettre la déconnexion

    if current_user.suspended?
      if request.xhr? || request.format.json?
        render json: { error: 'Compte suspendu', redirect: suspended_account_path }, status: :forbidden
      else
        redirect_to suspended_account_path
      end
    end
  end

  def skip_suspension_check?
    # Pages où on ne vérifie pas la suspension
    (controller_name == 'sessions' && action_name.in?(['destroy'])) ||
    (controller_name == 'registrations') ||
    (controller_name == 'passwords') ||
    (controller_name == 'confirmations') ||
    (controller_name == 'home') ||
    (controller_name == 'suspended_accounts')
  end
end
