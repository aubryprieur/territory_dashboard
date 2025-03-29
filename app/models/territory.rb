class Territory < ApplicationRecord
  validates :libgeo, presence: true
  validates :codgeo, presence: true, uniqueness: true

  # Méthode de recherche améliorée pour l'autocomplétion
  def self.search(term)
    if using_postgres?
      # Utilisation des fonctionnalités de PostgreSQL pour ignorer les accents
      where("unaccent(lower(libgeo)) LIKE unaccent(lower(?))", "%#{term}%").limit(10)
    else
      # Méthode standard pour les autres bases de données
      where('LOWER(libgeo) LIKE ?', "%#{term.downcase}%").limit(10)
    end
  end

  # Méthode pour formater la commune pour l'affichage dans l'autocomplétion
  def display_name
    "#{libgeo} (#{codgeo}) - Dép. #{dep}"
  end

  private

  # Vérifie si nous utilisons PostgreSQL
  def self.using_postgres?
    connection.adapter_name.downcase.include?('postgresql')
  end
end
