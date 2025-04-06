class Admin::UsersController < ApplicationController
  include UserAuthorization
  before_action :set_user, only: [:show, :edit, :update, :destroy]

  def requires_super_admin?
    true
  end

  def index
    @users = User.all
  end

  def show
  end

  def new
    @user = User.new
  end

  def create
    @user = User.new(user_params)

    # Si c'est un EPCI, s'assurer que le nom du territoire est correct
    if @user.territory_type == 'epci' && @user.territory_code.present?
      epci = Epci.find_by(epci: @user.territory_code)
      @user.territory_name = epci.libepci if epci
    end

    if @user.save
      redirect_to admin_users_path, notice: "L'utilisateur a été créé avec succès."
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

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:email, :password, :password_confirmation, :role, :territory_type, :territory_code, :territory_name)
  end
end
