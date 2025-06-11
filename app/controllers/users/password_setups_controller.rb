class Users::PasswordSetupsController < ApplicationController
  before_action :authenticate_user!
  before_action :ensure_needs_password_setup

  # Ignorer le check de configuration du mot de passe pour ce contrôleur
  skip_before_action :check_password_setup_required

  def show
    @user = current_user
    @password_requirements = password_requirements
  end

  def update
    @user = current_user
    @password_requirements = password_requirements

    if @user.update(password_setup_params)
      @user.update!(password_set: true, first_login: false)

      # Confirmer le compte automatiquement après la configuration du mot de passe
      @user.confirm! unless @user.confirmed?

      bypass_sign_in(@user) # Re-authenticate after password change

      redirect_to authenticated_root_path, notice: 'Votre mot de passe a été configuré avec succès. Bienvenue !'
    else
      render :show, status: :unprocessable_entity
    end
  end

  private

  def ensure_needs_password_setup
    unless current_user.needs_password_setup?
      redirect_to authenticated_root_path, notice: 'Votre mot de passe est déjà configuré.'
    end
  end

  def password_setup_params
    params.require(:user).permit(:password, :password_confirmation)
  end

  def password_requirements
    [
      'Au moins 12 caractères',
      'Au moins une lettre minuscule (a-z)',
      'Au moins une lettre majuscule (A-Z)',
      'Au moins un chiffre (0-9)',
      'Au moins un caractère spécial (@$!%*?&)',
      'Ne doit pas être un mot de passe courant'
    ]
  end
end
