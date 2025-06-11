class Admin::UsersController < ApplicationController
  include UserAuthorization
  before_action :set_user, only: [:show, :edit, :update, :destroy, :suspend, :reactivate, :resend_welcome_email]

  def requires_super_admin?
    true
  end

  def index
    @users = User.all.order(:email)

    # Filtrage par statut si demandé
    case params[:status]
    when 'suspended'
      @users = @users.suspended
    when 'active'
      @users = @users.active
    when 'needs_password_setup'
      @users = @users.where(password_set: false)
    end

    # Statistiques pour l'affichage
    @total_users = User.count
    @suspended_users = User.suspended.count
    @active_users = User.active.count
    @needs_password_setup = User.where(password_set: false).count
  end

  def show
  end

  def new
    @user = User.new
  end

  def create
    # Générer un mot de passe temporaire sécurisé
    temporary_password = generate_secure_temporary_password

    @user = User.new(user_params)
    @user.password = temporary_password
    @user.password_confirmation = temporary_password
    @user.password_set = false
    @user.first_login = true

    # Ne pas confirmer automatiquement - l'utilisateur devra le faire
    @user.skip_confirmation_notification!

    # Si c'est un EPCI, s'assurer que le nom du territoire est correct
    if @user.territory_type == 'epci' && @user.territory_code.present?
      epci = Epci.find_by(epci: @user.territory_code)
      @user.territory_name = epci.libepci if epci
    end

    if @user.save
      confirm_user_account(@user)

      # Envoyer l'email de bienvenue avec le mot de passe temporaire
      UserMailer.welcome_new_user(@user, temporary_password).deliver_now

      redirect_to admin_users_path, notice: "L'utilisateur a été créé avec succès. Un email de bienvenue a été envoyé."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    # Si l'utilisateur est associé à un EPCI, récupérer les informations d'affichage
    if @user.territory_type == 'epci' && @user.territory_code.present?
      @epci = Epci.find_by(epci: @user.territory_code)
      @epci_display_name = @epci ? "#{@epci.libepci} (#{@epci.epci}) - #{@epci.nature_epci}" : nil
    end
  end

  def update
    # Si c'est un EPCI, s'assurer que le nom du territoire est correct
    if user_params[:territory_type] == 'epci' && user_params[:territory_code].present?
      epci = Epci.find_by(epci: user_params[:territory_code])
      if epci
        # Créer une copie des paramètres et mettre à jour le nom du territoire
        updated_params = user_params.to_h
        updated_params[:territory_name] = epci.libepci

        if @user.update(updated_params)
          redirect_to admin_users_path, notice: "L'utilisateur a été mis à jour avec succès."
        else
          render :edit, status: :unprocessable_entity
        end
        return
      end
    end

    # Cas par défaut pour les autres types de territoires
    if @user.update(user_params)
      redirect_to admin_users_path, notice: "L'utilisateur a été mis à jour avec succès."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @user.destroy
    redirect_to admin_users_path, notice: "L'utilisateur a été supprimé avec succès."
  end

  def suspend
    reason = params[:reason].presence || "Suspension administrateur"

    if @user.suspend!(reason)
      redirect_to admin_users_path, notice: "L'utilisateur #{@user.email} a été suspendu avec succès."
    else
      redirect_to admin_users_path, alert: "Erreur lors de la suspension de l'utilisateur."
    end
  end

  def reactivate
    if @user.reactivate!
      redirect_to admin_users_path, notice: "L'utilisateur #{@user.email} a été réactivé avec succès."
    else
      redirect_to admin_users_path, alert: "Erreur lors de la réactivation de l'utilisateur."
    end
  end

  def resend_welcome_email
    # Générer un nouveau mot de passe temporaire
    temporary_password = generate_secure_temporary_password
    @user.update!(
      password: temporary_password,
      password_confirmation: temporary_password,
      password_set: false,
      first_login: true
    )

    # Confirmer le compte s'il ne l'est pas déjà
    confirm_user_account(@user) unless @user.confirmed?

    # Renvoyer l'email de bienvenue
    UserMailer.welcome_new_user(@user, temporary_password).deliver_now

    redirect_to admin_users_path, notice: "L'email de bienvenue a été renvoyé à #{@user.email}."
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation, :role, :territory_type, :territory_code, :territory_name)
  end

  def generate_secure_temporary_password
    # Générer un mot de passe temporaire sécurisé avec tous les types de caractères requis
    lowercase = ('a'..'z').to_a
    uppercase = ('A'..'Z').to_a
    numbers = ('0'..'9').to_a
    special_chars = %w[@ $ ! % * ? &]

    # S'assurer qu'on a au moins un caractère de chaque type
    password = []
    password << lowercase.sample(2)
    password << uppercase.sample(2)
    password << numbers.sample(2)
    password << special_chars.sample(2)

    # Compléter avec des caractères aléatoires pour atteindre 16 caractères
    all_chars = lowercase + uppercase + numbers + special_chars
    password << all_chars.sample(8)

    # Mélanger et joindre
    password.flatten.shuffle.join
  end

  def confirm_user_account(user)
    user.update_columns(
      confirmed_at: Time.current,
      confirmation_token: nil
    )
  end
end
