class DashboardController < ApplicationController
  include UserAuthorization
  include TerritoryNamesHelper
  include DashboardCache  # 🚀 Ajout du système de cache

  before_action :check_user_territory
  before_action :set_territory_info, only: [:index, :load_accueil, :load_synthese, :load_families,
                                            :load_schooling, :load_childcare,
                                            :load_employment, :load_domestic_violence, :load_children_comparison,
                                            :load_family_employment, :load_households, :load_diplomas,
                                            :load_housing, :load_caf_benefits,
                                            :load_revenues_poverty, :load_schools, :load_immigration, :load_local_economy, :load_equipment]

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
    @births_data = cached_births_data(@territory_code)
    @births_data_filtered = @births_data&.select { |item| item["geo_object"] == "COM" } || []
    # Structure par âge, pyramide, PCS, mobilité, série longue 1968-2023 (API /population-structure/*)
    load_population_structure_comparison

    # 🆕 Calcul des projections naissances 2035
    if @population_data.present?
      @women_15_49 = calculate_women_15_49_from_population(@population_data)
      @births_projection_2035 = calculate_births_projection_2035(@women_15_49) if @women_15_49 > 0
      Rails.logger.debug "📊 Commune #{@territory_code} : #{@women_15_49} femmes → #{@births_projection_2035} naissances 2035"

      # 🆕 Générer les données de projection avec graphique
      @births_projection_data = generate_commune_births_projection_data(
        @births_data_filtered,
        @births_projection_2035,
        @women_15_49
      )
    end

    respond_to do |format|
      format.html { render partial: 'synthese', locals: {
        births_data_filtered: @births_data_filtered,
        women_15_49: @women_15_49,
        births_projection_2035: @births_projection_2035,
        births_projection_data: @births_projection_data,
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

  def load_households
    # Ménages : commune + territoires de comparaison (INSEE RP 2012, 2017, 2023)
    @household_data = cached_households_data(:commune, @territory_code)
    @epci_household_data = cached_households_data(:epci, @epci_code)
    @department_household_data = cached_households_data(:department, @department_code)
    @region_household_data = cached_households_data(:region, @region_code)
    @france_household_data = cached_households_data(:france)

    respond_to do |format|
      format.html { render partial: 'households' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_diplomas
    # Diplômes et formation : commune + territoires de comparaison (INSEE RP 2012, 2017, 2023)
    load_education_training_comparison

    respond_to do |format|
      format.html { render partial: 'diplomas' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_children_comparison
    # 🚀 Chargement spécifique pour la comparaison enfants avec cache
    @children_data = cached_children_data(@territory_code)

    # 🆕 Charger les données de population et naissances pour les projections
    @population_data = cached_population_data(@territory_code)
    @births_data = cached_births_data(@territory_code)
    @births_data_filtered = @births_data&.select { |item| item["geo_object"] == "COM" } || []

    # 🆕 Calculer les projections d'enfants 0-3 ans
    if @population_data.present? && @births_data_filtered.present?
      @women_15_49 = calculate_women_15_49_from_population(@population_data)
      @births_projection_2035 = calculate_births_projection_2035(@women_15_49) if @women_15_49 > 0

      # 🆕 Générer les données de projection des naissances (2 scénarios)
      @births_projection_data = generate_commune_births_projection_data(
        @births_data_filtered,
        @births_projection_2035,
        @women_15_49
      )

      # 🆕 Calculer la projection des enfants 0-3 ans
      @children_0_3_projection_2035 = calculate_children_0_3_projection_2035_commune(@births_projection_data)

      # 🆕 Calculer le nombre actuel d'enfants 0-3 ans
      @current_children_0_3 = calculate_under_3_count(@population_data)
    end

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
        region_code: @region_code,
        # 🆕 Ajouter les nouvelles données de projection
        births_projection_data: @births_projection_data,
        children_0_3_projection_2035: @children_0_3_projection_2035,
        current_children_0_3: @current_children_0_3,
        women_15_49: @women_15_49
      }}
      format.json { render json: { status: 'success' } }
    end
  end


  def load_schooling
    # Scolarisation (INSEE RP 2012, 2017, 2023) : commune + territoires de comparaison
    load_education_training_comparison

    respond_to do |format|
      format.html { render partial: 'schooling' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_childcare
    # Onglet Garde d'enfants : offre d'accueil du jeune enfant (Cnaf 2017-2023, API /childcare-offer/*).
    # La projection du taux de couverture en 2035 est retirée pour l'instant
    # (calculate_childcare_coverage_projection_2035 est conservée pour une prochaine version).
    load_childcare_offer_comparison
    # Familles employant une assistante maternelle (Flores 2021)
    load_economic_fabric_comparison

    respond_to do |format|
      format.html { render partial: 'childcare' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_local_economy
    # Onglet Tissu économique : emplois au lieu de travail (INSEE RP) et établissements employeurs (Flores)
    load_employment_activity_comparison
    load_economic_fabric_comparison

    respond_to do |format|
      format.html { render partial: 'local_economy' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_equipment
    # Onglet Équipements : services de proximité, densités comparées, distances (INSEE, BPE 2025 — API /equipment/*)
    @equipment_data = cached_equipment_data(:commune, @territory_code)

    respond_to do |format|
      format.html { render partial: 'equipment' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_immigration
    # Onglet Immigrés et étrangers (ABS) : parts dans la population, emploi, âge (INSEE, recensement 2023 —
    # API /immigration/*)
    load_immigration_comparison

    respond_to do |format|
      format.html { render partial: 'immigration' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_schools
    # Onglet Éducation nationale (ABS) : IPS et déciles nationaux, valeur ajoutée, indice d'éloignement
    # (DEPP — API /schools/*)
    load_schools_data

    respond_to do |format|
      format.html { render partial: 'schools' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_revenues_poverty
    # Onglet Revenus et pauvreté (ABS) : niveau de vie, pauvreté, inégalités, structure du revenu
    # (INSEE, Filosofi 2017-2021 et 2023 — API /revenues-poverty/*)
    load_revenues_poverty_comparison

    respond_to do |format|
      format.html { render partial: 'revenues_poverty' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_caf_benefits
    # Onglet Prestations CAF (ABS) : allocataires, RSA, prime d'activité, aides au logement, AAH, familles
    # (Cnaf, décembre 2020-2024 — API /caf-benefits/*)
    load_caf_benefits_comparison

    respond_to do |format|
      format.html { render partial: 'caf_benefits' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_housing
    # Onglet Logement (ABS) : parc, statut d'occupation, peuplement, mobilité résidentielle,
    # conditions de vie (INSEE RP 2012, 2017, 2023 — API /housing/*)
    load_housing_comparison

    respond_to do |format|
      format.html { render partial: 'housing' }
      format.json { render json: { status: 'success' } }
    end
  end

  def load_employment
    # Onglet Emploi (ABS) : emploi, activité, chômage, femmes, emploi local, mobilité
    # (INSEE RP 2012, 2017, 2023) + emploi des parents de jeunes enfants (2023)
    load_employment_activity_comparison
    # Familles (API /families/*) : enfants de moins de 6 ans selon l'activité des parents (2023)
    @family_data = cached_family_data(@territory_code)
    @epci_family_data = cached_epci_family_data(@epci_code)
    @department_family_data = cached_department_family_data(@department_code)
    @region_family_data = cached_region_family_data(@region_code)
    @france_family_data = cached_france_family_data

    respond_to do |format|
      format.html { render partial: 'employment' }
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

  def calculate_women_15_49(population_by_age)
    return 0 if population_by_age.blank?

    women_15_49 = population_by_age
      .select { |age_data| (15..49).include?(age_data["age"].to_i) }
      .sum { |age_data| age_data["women"].to_f }

    women_15_49.round(0)
  end

  def calculate_births_projection_2035(women_count, icf = 1.6)
    return 0 if women_count.blank? || women_count <= 0

    # Formule INSEE : naissances = femmes 15-49 ans × (ICF / 35 années fertiles)
    (women_count * (icf.to_f / 35.0)).round(0)
  end

  def calculate_women_15_49_from_population(population_data)
    return 0 if population_data.blank?

    # Calculer les femmes de 15-49 ans depuis population_data
    # Structure : item["AGED100"] = âge, item["SEXE"] = 1 (homme) ou 2 (femme), item["NB"] = nombre
    women_15_49 = population_data
      .select { |item|
        (15..49).include?(item["AGED100"].to_i) &&
        item["SEXE"].to_s == "2"  # SEXE = 2 pour les femmes
      }
      .sum { |item| item["NB"].to_f }

    women_15_49.round(0)
  end

  def generate_commune_births_projection_data(births_data_filtered, births_2035_target, women_count)
    return {} if births_data_filtered.blank? || women_count.blank? || women_count == 0

    # Construire un dictionnaire année → naissances à partir des données
    births_by_year = {}
    births_data_filtered.each do |item|
      year = item["ANNEE"] || item["annee"] || item["year"] || item["time_period"]
      count = item["NB"] || item["naissances"] || item["births"] || item["obs_value"]

      next if year.blank? || count.blank?

      year_int = year.to_i
      births_by_year[year_int] = count.to_f
    end

    return {} if births_by_year.empty?

    years_available = births_by_year.keys.sort
    last_year = years_available.max
    last_births_count = births_by_year[last_year]

    Rails.logger.debug "📊 Données naissances trouvées : #{years_available.inspect}, dernière année: #{last_year}, dernier effectif: #{last_births_count}"

    # 🆕 DEUX SCÉNARIOS : Stable et -10%
    target_stable = last_births_count                    # Scénario stable
    target_minus_10 = (last_births_count * 0.9).round(0) # Scénario -10%

    projection_years = []
    projection_values_stable = []
    projection_values_minus_10 = []

    # PHASE 1 : Du dernier enregistrement à 2025 - INTERPOLATION LINÉAIRE
    (last_year..2025).each do |year|
      projection_years << year

      years_elapsed = year - last_year
      transition_years = 2025 - last_year

      if transition_years > 0
        # Interpolation linéaire vers les 2 cibles
        value_stable = last_births_count - (last_births_count - target_stable) * (years_elapsed.to_f / transition_years)
        value_minus_10 = last_births_count - (last_births_count - target_minus_10) * (years_elapsed.to_f / transition_years)

        projection_values_stable << value_stable.round(0)
        projection_values_minus_10 << value_minus_10.round(0)
      else
        projection_values_stable << target_stable
        projection_values_minus_10 << target_minus_10
      end
    end

    # PHASE 2 : De 2026 à 2035 - STABILITÉ (ligne horizontale)
    (2026..2035).each do |year|
      projection_years << year
      projection_values_stable << target_stable
      projection_values_minus_10 << target_minus_10
    end

    {
      historical_years: years_available,
      historical_values: years_available.map { |y| births_by_year[y].round(0) },
      projection_years: projection_years,
      projection_values_stable: projection_values_stable,
      projection_values_minus_10: projection_values_minus_10,
      last_year: last_year,
      target_stable: target_stable,
      target_minus_10: target_minus_10
    }
  end

  # 🆕 Calculer le nombre d'enfants actuels de 0-3 ans
  def calculate_under_3_count(population_data)
    return 0 if population_data.blank?

    population_data
      .select { |item| item["AGED100"].to_i <= 2 }
      .sum { |item| item["NB"].to_f }
      .round(0)
  end

  # 🆕 Calculer la projection des enfants 0-3 ans pour les communes
  # avec deux scénarios (stable et -10%)
  def calculate_children_0_3_projection_2035_commune(births_projection_data)
    return {} if births_projection_data.blank?

    # Récupérer les scénarios de naissances (stable et -10%)
    births_stable = births_projection_data[:target_stable]
    births_minus_10 = births_projection_data[:target_minus_10]

    return {} if births_stable.blank? || births_minus_10.blank?

    # Constantes de calcul
    years_aggregated = 3  # Enfants de 0, 1, 2 ans
    survival_rate = 0.9965  # Taux de survie (mortalité ~3,5 pour 1000)

    # Calcul des deux scénarios
    children_0_3_stable = (births_stable * years_aggregated * survival_rate).round(0)
    children_0_3_minus_10 = (births_minus_10 * years_aggregated * survival_rate).round(0)

    {
      stable: children_0_3_stable,
      minus_10: children_0_3_minus_10,
      births_stable: births_stable,
      births_minus_10: births_minus_10
    }
  end

  # 🆕 Calcul robuste du nombre d'enfants 0-3 ans pour communes
  # Gère les deux structures de données possibles
  def calculate_under_3_count_safe(population_data)
    return 0 if population_data.blank?

    # Cas 1 : Structure directe (tableau avec AGED100)
    if population_data.is_a?(Array) && population_data.first&.key?("AGED100")
      return population_data
        .select { |item| item["AGED100"].to_i <= 2 }
        .sum { |item| item["NB"].to_f }
        .round(0)
    end

    # Cas 2 : Structure avec population_by_age (EPCI)
    if population_data.is_a?(Hash) && population_data["population_by_age"].present?
      population_by_age = population_data["population_by_age"]
      return population_by_age
        .select { |age_data| age_data["age"].to_i <= 2 }
        .sum { |age_data| (age_data["men"].to_f + age_data["women"].to_f) }
        .round(0)
    end

    0
  end

  # 🆕 Calculer la projection du taux de couverture en 2035 (pour communes)
  def calculate_childcare_coverage_projection_2035(
    current_coverage_rate,
    current_children_count,
    projected_children_count
  )
    return {} if current_coverage_rate.blank? || current_coverage_rate <= 0

    # Calculer le nombre de places actuelles
    current_places = (current_coverage_rate / 100.0) * current_children_count

    # Variation proportionnelle d'enfants
    children_ratio = projected_children_count.to_f / current_children_count.to_f

    # 🔵 SCÉNARIO 1 : Offre constante (places inchangées)
    conservative_rate = (current_places / projected_children_count * 100).round(1)

    # 🟢 SCÉNARIO 2 : Offre proportionnelle (maintien du taux)
    proportional_places = current_places * children_ratio
    proportional_rate = (proportional_places / projected_children_count * 100).round(1)

    # 🟣 SCÉNARIO 3 : Offre augmentée de 20%
    ambitious_places = current_places * 1.2
    ambitious_rate = (ambitious_places / projected_children_count * 100).round(1)

    {
      current_rate: current_coverage_rate,
      current_places: current_places.round(0),
      current_children: current_children_count,
      projected_children: projected_children_count,
      children_evolution_pct: ((projected_children_count - current_children_count).to_f / current_children_count * 100).round(1),
      scenarios: {
        conservative: {
          label: "Offre constante",
          rate: conservative_rate,
          places: current_places.round(0),
          evolution: (conservative_rate - current_coverage_rate).round(1),
          description: "Les places actuelles restent inchangées"
        },
        proportional: {
          label: "Offre proportionnelle (maintien du TCG)",
          rate: proportional_rate,
          places: proportional_places.round(0),
          evolution: (proportional_rate - current_coverage_rate).round(1),
          description: "L'offre suit l'évolution démographique"
        },
        ambitious: {
          label: "Offre augmentée (+20%)",
          rate: ambitious_rate,
          places: ambitious_places.round(0),
          evolution: (ambitious_rate - current_coverage_rate).round(1),
          description: "Augmentation volontariste de 20% des places"
        }
      }
    }
  end
end
