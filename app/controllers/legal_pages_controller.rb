# Pages légales publiques : mentions légales, politique de confidentialité, CGU, sources des données,
# déclaration d'accessibilité.
# Accessibles à tous (visiteurs, utilisateurs connectés, y compris suspendus ou en attente de mot de passe).
class LegalPagesController < ApplicationController
  skip_before_action :check_password_setup_required

  def mentions_legales; end
  def confidentialite; end
  def cgu; end
  def sources; end
  def accessibilite; end
end
