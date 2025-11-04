class DashboardController < ApplicationController
  include UserAuthorization
  include RevenueAnalysisHelper
  include TerritoryNamesHelper
  include DashboardCache  # 🚀 Ajout du système de cache

  before_action :check_user_territory
  before_action :set_territory_info, only: [:index, :load_accueil, :load_synthese, :load_families, :load_age_pyramid,
                                            :load_economic_data, :load_schooling, :load_childcare,
                                            :load_employment, :load_domestic_violence, :load_children_comparison,
                                            :load_family_employment]

  def index
    # Vérifier si l'utilisateur est suspendu
    if current_user.suspended?
      redirect_to suspended_account_path
      return
    end

    # Vérification que le territoire est valide
    unless @territory_code.present?
      redirect_to root_path, alert: "Aucun territoire disponible pour afficher le dashboard."
      return
    end

    # Chargement immédiat des données essentielles seulement
    territory = Territory.find_by(codgeo: @territory_code)

    # Vérifier que le territoire existe dans la base
    unless territory
      redirect_to root_path, alert: "Le territoire demandé n'existe pas dans notre base de données."
      return
    end

    @basic_info = {
      commune_name: @territory_name,
      territory_code: @territory_code,
      population: cached_population_data(@territory_code)&.sum { |item| item["NB"].to_f }&.round || 0,
      epci_code: territory&.epci,
      department_code: territory&.dep,
      region_code: territory&.reg,
      is_commune_access_from_epci: @is_commune_access_from_epci
    }

    begin
      # Précharger les données essentielles en arrière-plan
      preload_essential_data(@territory_code, territory&.epci, territory&.dep, territory&.reg)
    rescue => e
      Rails.logger.error "Error preloading essential data: #{e.message}"
      # Continuer même si le préchargement échoue
    end

    # Les autres données seront chargées en AJAX
    respond_to do |format|
      format.html # Affichage immédiat de la structure de base
      format.turbo_stream # Pour les mises à jour partielles
    end
  rescue => e
    Rails.logger.error "Dashboard index error: #{e.message}"
    redirect_to root_path, alert: "Une erreur est survenue lors du chargement du dashboard."
  end

  # === ACTIONS ASYNCHRONES POUR CHAQUE SECTION (AVEC CACHE) ===

  def load_synthese
    # 🚀 Chargement des données de synthèse avec cache
    @population_data = cached_population_data(@territory_code)
    @total_population = @population_data.present? ? @population_data.sum { |item| item["NB"].to_f }.round : 0
    @historical_data = cached_historical_data(@territory_code)
    @births_data = cached_births_data(@territory_code)
    @births_data_filtered = @births_data&.select { |item| item["geo_object"] == "COM" } || []

    # 🔍 DEBUG : Ajouter ces logs
    Rails.logger.debug "🔍 Births data total: #{@births_data&.size || 0} items"
    Rails.logger.debug "🔍 Births data sample: #{@births_data&.first&.keys || 'nil'}"
    Rails.logger.debug "🔍 Births data filtered: #{@births_data_filtered.size} items"
    Rails.logger.debug "🔍 Sample filtered item: #{@births_data_filtered.first || 'empty'}"

    # 🔧 AJOUT MANQUANT : Préparer les données de la pyramide des âges
    @age_pyramid_data = prepare_age_pyramid_data(@population_data)

    respond_to do |format|
      format.html { render partial: 'synthese', locals: {
        population_data: @population_data,
        total_population: @total_population,
        historical_data: @historical_data,
        births_data_filtered: @births_data_filtered,
        age_pyramid_data: @age_pyramid_data,  # 🔧 AJOUT : Passer les données de la pyramide
        territory_code: @territory_code,
        territory_name: @territory_name
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  def load_accueil
    # L'onglet accueil ne nécessite pas de chargement asynchrone de données
    # On rend simplement le partial avec les données de base déjà disponibles
    respond_to do |format|
      format.html { render partial: 'accueil', locals: {
        basic_info: @basic_info
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  def load_age_pyramid
    # 🚀 Chargement spécifique des données de la pyramide des âges avec cache
    @age_pyramid_data = cached_age_pyramid_data(@territory_code)

    respond_to do |format|
      format.json { render json: @age_pyramid_data }
      format.html { render partial: 'age_pyramid', locals: { age_pyramid_data: @age_pyramid_data } }
    end
  end

  def load_families
    # 🚀 Chargement des données familles avec cache
    @children_data = cached_children_data(@territory_code)
    @births_data = cached_births_data(@territory_code)
    @births_data_filtered = @births_data&.select { |item| item["geo_object"] == "COM" } || []
    @family_data = cached_family_data(@territory_code)

    # Données de comparaison avec cache
    load_comparison_data_for_families_cached

    respond_to do |format|
      format.html { render partial: 'families', locals: {
        children_data: @children_data,
        births_data_filtered: @births_data_filtered,
        family_data: @family_data,
        france_children_data: @france_children_data,
        france_family_data: @france_family_data,
        epci_children_data: @epci_children_data,
        epci_family_data: @epci_family_data,
        department_children_data: @department_children_data,
        department_family_data: @department_family_data,
        region_children_data: @region_children_data,
        region_family_data: @region_family_data,
        epci_code: @epci_code,
        department_code: @department_code,
        region_code: @region_code
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  def load_children_comparison
    # 🚀 Chargement spécifique pour la comparaison enfants avec cache
    @children_data = cached_children_data(@territory_code)
    load_comparison_data_for_children_cached

    respond_to do |format|
      format.html { render partial: 'children_comparison', locals: {
        children_data: @children_data,
        france_children_data: @france_children_data,
        epci_children_data: @epci_children_data,
        department_children_data: @department_children_data,
        region_children_data: @region_children_data,
        epci_code: @epci_code,
        department_code: @department_code,
        region_code: @region_code
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  def load_economic_data
    # 🚀 Chargement des données économiques avec cache
    @revenue_data = cached_revenue_data(@territory_code)

    # Données de comparaison avec cache
    load_comparison_data_for_economy_cached

    respond_to do |format|
      format.html { render partial: 'economic_data', locals: {
        revenue_data: @revenue_data,
        france_revenue_data: @france_revenue_data,
        epci_revenue_data: @epci_revenue_data,
        department_revenue_data: @department_revenue_data,
        region_revenue_data: @region_revenue_data,
        epci_code: @epci_code,
        department_code: @department_code,
        region_code: @region_code
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  def load_schooling
    # 🚀 Chargement des données de scolarité avec cache
    @schooling_data = cached_schooling_data(@territory_code)

    # Données de comparaison avec cache
    load_comparison_data_for_schooling_cached

    respond_to do |format|
      format.html { render partial: 'schooling', locals: {
        schooling_data: @schooling_data,
        france_schooling_data: @france_schooling_data,
        epci_schooling_data: @epci_schooling_data,
        department_schooling_data: @department_schooling_data,
        region_schooling_data: @region_schooling_data,
        epci_code: @epci_code,
        department_code: @department_code,
        region_code: @region_code
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  def load_childcare
    # 🚀 Chargement des données de garde d'enfants avec cache
    @childcare_data = cached_childcare_data(@territory_code)

    # Données de comparaison avec cache
    load_comparison_data_for_childcare_cached

    respond_to do |format|
      format.html { render partial: 'childcare', locals: {
        childcare_data: @childcare_data,
        france_childcare_data: @france_childcare_data,
        epci_childcare_data: @epci_childcare_data,
        department_childcare_data: @department_childcare_data,
        region_childcare_data: @region_childcare_data,
        epci_code: @epci_code,
        department_code: @department_code,
        region_code: @region_code
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  def load_employment
    # 🚀 Chargement des données d'emploi avec cache
    @employment_data = cached_employment_data(@territory_code)
    @family_employment_under3_data = cached_family_employment_under3_data(@territory_code)
    @family_employment_3to5_data = cached_family_employment_3to5_data(@territory_code)

    # Données de comparaison avec cache
    load_comparison_data_for_employment_cached

    respond_to do |format|
      format.html { render partial: 'employment', locals: {
        employment_data: @employment_data,
        family_employment_under3_data: @family_employment_under3_data,
        family_employment_3to5_data: @family_employment_3to5_data,
        france_employment_data: @france_employment_data,
        france_family_employment_under3_data: @france_family_employment_under3_data,
        france_family_employment_3to5_data: @france_family_employment_3to5_data,
        epci_employment_data: @epci_employment_data,
        epci_family_employment_under3_data: @epci_family_employment_under3_data,
        epci_family_employment_3to5_data: @epci_family_employment_3to5_data,
        department_employment_data: @department_employment_data,
        department_family_employment_under3_data: @department_family_employment_under3_data,
        department_family_employment_3to5_data: @department_family_employment_3to5_data,
        region_employment_data: @region_employment_data,
        region_family_employment_under3_data: @region_family_employment_under3_data,
        region_family_employment_3to5_data: @region_family_employment_3to5_data,
        epci_code: @epci_code,
        department_code: @department_code,
        region_code: @region_code
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  def load_family_employment
    # 🚀 Chargement spécifique des données emploi familial avec cache
    @family_employment_under3_data = cached_family_employment_under3_data(@territory_code)
    @family_employment_3to5_data = cached_family_employment_3to5_data(@territory_code)

    # Données de comparaison avec cache
    load_comparison_data_for_family_employment_cached

    respond_to do |format|
      format.html { render partial: 'family_employment', locals: {
        family_employment_under3_data: @family_employment_under3_data,
        family_employment_3to5_data: @family_employment_3to5_data,
        france_family_employment_under3_data: @france_family_employment_under3_data,
        france_family_employment_3to5_data: @france_family_employment_3to5_data,
        epci_family_employment_under3_data: @epci_family_employment_under3_data,
        epci_family_employment_3to5_data: @epci_family_employment_3to5_data,
        department_family_employment_under3_data: @department_family_employment_under3_data,
        department_family_employment_3to5_data: @department_family_employment_3to5_data,
        region_family_employment_under3_data: @region_family_employment_under3_data,
        region_family_employment_3to5_data: @region_family_employment_3to5_data,
        epci_code: @epci_code,
        department_code: @department_code,
        region_code: @region_code
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  def load_domestic_violence
    # 🚀 Chargement des données de sécurité/violence domestique avec cache
    @safety_data = cached_safety_data(@territory_code)

    # Données de comparaison avec cache
    load_comparison_data_for_safety_cached

    respond_to do |format|
      format.html { render partial: 'domestic_violence', locals: {
        safety_data: @safety_data,
        department_safety_data: @department_safety_data,
        region_safety_data: @region_safety_data,
        department_code: @department_code,
        region_code: @region_code
      }}
      format.json { render json: { status: 'success' } }
    end
  end

  # 🛠️ Actions utilitaires pour la gestion du cache
  def clear_cache
    # Action pour vider le cache d'un territoire (pour les admins)
    if current_user.super_admin?
      invalidate_territory_cache(@territory_code)
      render json: { status: 'success', message: 'Cache invalidé avec succès' }
    else
      render json: { status: 'error', message: 'Non autorisé' }, status: :forbidden
    end
  end

  private

  def set_territory_info
    # Déterminer le code territoire à utiliser
    if params[:commune_code].present?
      # Si un code commune est fourni en paramètre
      @territory_code = params[:commune_code]
      territory = Territory.find_by(codgeo: @territory_code)
      @territory_name = territory&.libgeo || "Commune inconnue"
      @is_commune_access_from_epci = true

      # 🔧 CORRECTION : Stocker les informations dans la session pour debugging
      session[:last_commune_access] = {
        commune_code: @territory_code,
        commune_name: @territory_name,
        accessed_at: Time.current,
        user_territory_type: current_user.territory_type,
        user_territory_code: current_user.territory_code
      }
    else
      # Utiliser le territoire de l'utilisateur
      @territory_code = current_user.territory_code
      @territory_name = current_user.territory_name
      @is_commune_access_from_epci = false
    end

    # Récupérer les codes des territoires de comparaison
    territory = Territory.find_by(codgeo: @territory_code)
    if territory
      @epci_code = territory.epci
      @department_code = territory.dep
      @region_code = territory.reg
    end
  end

  def check_user_territory
    # 🔧 CORRECTION : Logging pour debugging
    Rails.logger.info "=== DASHBOARD ACCESS DEBUG ==="
    Rails.logger.info "User: #{current_user.email}"
    Rails.logger.info "User territory type: #{current_user.territory_type}"
    Rails.logger.info "User territory code: #{current_user.territory_code}"
    Rails.logger.info "Requested commune_code: #{params[:commune_code]}"
    Rails.logger.info "Session info: #{session[:last_commune_access]}"

    # Si un paramètre commune_code est fourni, vérifier les autorisations spécifiques
    if params[:commune_code].present?
      unless user_can_access_commune?(params[:commune_code])
        Rails.logger.error "ACCESS DENIED to commune #{params[:commune_code]} for user #{current_user.email}"
        redirect_to root_path, alert: "Vous n'avez pas l'autorisation d'accéder à cette commune."
        return
      end
      Rails.logger.info "ACCESS GRANTED to commune #{params[:commune_code]} for user #{current_user.email}"
      return # Sortir de la méthode si on a validé l'accès via commune_code
    end

    # Vérification standard pour les utilisateurs sans paramètre commune_code
    unless current_user.territory_code.present?
      if current_user.super_admin?
        redirect_to admin_users_path, notice: "En tant que Super Admin, vous avez été redirigé vers la gestion des utilisateurs."
      else
        redirect_to root_path, alert: "Vous n'avez pas de territoire associé à votre compte. Veuillez contacter un administrateur."
      end
    end
  end

  def user_can_access_commune?(commune_code)
    Rails.logger.info "=== CHECKING COMMUNE ACCESS ==="
    Rails.logger.info "Commune code: #{commune_code}"

    # Vérifier que la commune existe
    territory = Territory.find_by(codgeo: commune_code)
    unless territory
      Rails.logger.error "Territory not found for code: #{commune_code}"
      return false
    end

    Rails.logger.info "Territory found: #{territory.libgeo}, EPCI: #{territory.epci}"

    # Les super_admin peuvent accéder à toutes les communes
    if current_user.super_admin?
      Rails.logger.info "Access granted: Super admin"
      return true
    end

    # Si l'utilisateur est de type EPCI, vérifier que la commune appartient à son EPCI
    if current_user.territory_type == 'epci'
      access_granted = (territory.epci == current_user.territory_code)
      Rails.logger.info "EPCI access check: territory.epci=#{territory.epci}, user.territory_code=#{current_user.territory_code}, granted=#{access_granted}"
      return access_granted
    end

    # Si l'utilisateur est de type commune, il peut accéder à sa propre commune
    if current_user.territory_type == 'commune'
      access_granted = (commune_code == current_user.territory_code)
      Rails.logger.info "Commune access check: granted=#{access_granted}"
      return access_granted
    end

    # Pour les autres cas, refuser l'accès
    Rails.logger.error "Access denied: No matching territory type"
    false
  end

  def prepare_age_pyramid_data(population_data)
    return {} if population_data.blank?

    age_groups = []
    male_counts = []
    female_counts = []

    (0..100).each do |age|
      age_str = age.to_s
      male_count = population_data.select { |item| item["AGED100"].to_s == age_str && item["SEXE"].to_s == "1" }
                                  .sum { |item| item["NB"].to_f }
      female_count = population_data.select { |item| item["AGED100"].to_s == age_str && item["SEXE"].to_s == "2" }
                                    .sum { |item| item["NB"].to_f }

      label = (age == 100) ? "100+" : age.to_s

      age_groups << label
      male_counts << male_count.round
      female_counts << female_count.round
    end

    # Inverser les groupes d'âge pour que les plus jeunes soient en bas
    result = {
      ageGroups: age_groups.reverse,
      maleData: male_counts.reverse,
      femaleData: female_counts.reverse
    }

    Rails.logger.debug "🔍 Age pyramid data prepared: #{result[:ageGroups].size} groups, #{result[:maleData].sum} males, #{result[:femaleData].sum} females"

    result
  end

  # === MÉTHODES POUR CHARGER LES DONNÉES DE COMPARAISON AVEC CACHE ===

  def load_comparison_data_for_families_cached
    @france_children_data = cached_france_children_data
    @france_family_data = cached_france_family_data

    @epci_children_data = cached_epci_children_data(@epci_code)
    @epci_family_data = cached_epci_family_data(@epci_code)

    @department_children_data = cached_department_children_data(@department_code)
    @department_family_data = cached_department_family_data(@department_code)

    @region_children_data = cached_region_children_data(@region_code)
    @region_family_data = cached_region_family_data(@region_code)
  end

  def load_comparison_data_for_children_cached
    @france_children_data = cached_france_children_data
    @epci_children_data = cached_epci_children_data(@epci_code)
    @department_children_data = cached_department_children_data(@department_code)
    @region_children_data = cached_region_children_data(@region_code)
  end

  def load_comparison_data_for_economy_cached
    @france_revenue_data = cached_france_revenue_data
    @epci_revenue_data = cached_epci_revenue_data(@epci_code)
    @department_revenue_data = cached_department_revenue_data(@department_code)
    @region_revenue_data = cached_region_revenue_data(@region_code)
  end

  def load_comparison_data_for_schooling_cached
    @france_schooling_data = cached_france_schooling_data
    @epci_schooling_data = cached_epci_schooling_data(@epci_code)
    @department_schooling_data = cached_department_schooling_data(@department_code)
    @region_schooling_data = cached_region_schooling_data(@region_code)
  end

  def load_comparison_data_for_childcare_cached
    @france_childcare_data = cached_france_childcare_data
    @epci_childcare_data = cached_epci_childcare_data(@epci_code)
    @department_childcare_data = cached_department_childcare_data(@department_code)
    @region_childcare_data = cached_region_childcare_data(@region_code)
  end

  def load_comparison_data_for_employment_cached
    @france_employment_data = cached_france_employment_data
    @france_family_employment_under3_data = cached_france_family_employment_under3_data
    @france_family_employment_3to5_data = cached_france_family_employment_3to5_data

    @epci_employment_data = cached_epci_employment_data(@epci_code)
    @epci_family_employment_under3_data = cached_epci_family_employment_under3_data(@epci_code)
    @epci_family_employment_3to5_data = cached_epci_family_employment_3to5_data(@epci_code)

    @department_employment_data = cached_department_employment_data(@department_code)
    @department_family_employment_under3_data = cached_department_family_employment_under3_data(@department_code)
    @department_family_employment_3to5_data = cached_department_family_employment_3to5_data(@department_code)

    @region_employment_data = cached_region_employment_data(@region_code)
    @region_family_employment_under3_data = cached_region_family_employment_under3_data(@region_code)
    @region_family_employment_3to5_data = cached_region_family_employment_3to5_data(@region_code)
  end

  def load_comparison_data_for_family_employment_cached
    @france_family_employment_under3_data = cached_france_family_employment_under3_data
    @france_family_employment_3to5_data = cached_france_family_employment_3to5_data

    @epci_family_employment_under3_data = cached_epci_family_employment_under3_data(@epci_code)
    @epci_family_employment_3to5_data = cached_epci_family_employment_3to5_data(@epci_code)

    @department_family_employment_under3_data = cached_department_family_employment_under3_data(@department_code)
    @department_family_employment_3to5_data = cached_department_family_employment_3to5_data(@department_code)

    @region_family_employment_under3_data = cached_region_family_employment_under3_data(@region_code)
    @region_family_employment_3to5_data = cached_region_family_employment_3to5_data(@region_code)
  end

  def load_comparison_data_for_safety_cached
    @department_safety_data = cached_department_safety_data(@department_code)
    @region_safety_data = cached_region_safety_data(@region_code)
  end

  # 🚀 Anciennes méthodes conservées pour compatibilité (pourraient être supprimées)
  def load_comparison_data_for_families
    load_comparison_data_for_families_cached
  end

  def load_comparison_data_for_children
    load_comparison_data_for_children_cached
  end

  def load_comparison_data_for_economy
    load_comparison_data_for_economy_cached
  end

  def load_comparison_data_for_schooling
    load_comparison_data_for_schooling_cached
  end

  def load_comparison_data_for_childcare
    load_comparison_data_for_childcare_cached
  end

  def load_comparison_data_for_employment
    load_comparison_data_for_employment_cached
  end

  def load_comparison_data_for_family_employment
    load_comparison_data_for_family_employment_cached
  end

  def load_comparison_data_for_safety
    load_comparison_data_for_safety_cached
  end
end
