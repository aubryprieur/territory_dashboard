class Territory < ApplicationRecord
  validates :libgeo, presence: true
  validates :codgeo, presence: true, uniqueness: true

  belongs_to :epci_relation, class_name: 'Epci', foreign_key: :epci, primary_key: :epci, optional: true

  # Méthode de recherche améliorée pour l'autocomplétion
  def self.search(term)
    # Échappe les caractères spéciaux dans la recherche
    escaped_term = term.gsub(/[%_]/, { '%' => '\\%', '_' => '\\_' })

    if using_postgres?
      # Version améliorée pour PostgreSQL
      territories = where("unaccent(lower(libgeo)) LIKE unaccent(lower(?)) OR codgeo LIKE ?",
                      "%#{escaped_term}%", "#{escaped_term}%")

      # Récupérer les correspondances exactes en premier
      exact_matches = territories.where("lower(libgeo) = lower(?)", escaped_term)

      # Récupérer les correspondances qui commencent par le terme
      starts_with_matches = territories.where("lower(libgeo) LIKE lower(?)", "#{escaped_term}%")
                                    .where.not(id: exact_matches.select(:id))

      # Récupérer les autres correspondances
      other_matches = territories.where.not(id: exact_matches.select(:id))
                              .where.not(id: starts_with_matches.select(:id))

      # Combiner et limiter les résultats
      result = exact_matches.limit(5) + starts_with_matches.limit(10) + other_matches.limit(5)
      result.uniq.first(15)
    else
      # Version améliorée pour autres bases de données
      territories = where('LOWER(libgeo) LIKE ? OR codgeo LIKE ?',
                      "%#{escaped_term.downcase}%", "#{escaped_term}%")

      # Même logique que ci-dessus
      exact_matches = territories.where('LOWER(libgeo) = ?', escaped_term.downcase)
      starts_with_matches = territories.where('LOWER(libgeo) LIKE ?', "#{escaped_term.downcase}%")
                                   .where.not(id: exact_matches.select(:id))
      other_matches = territories.where.not(id: exact_matches.select(:id))
                              .where.not(id: starts_with_matches.select(:id))

      result = exact_matches.limit(5) + starts_with_matches.limit(10) + other_matches.limit(5)
      result.uniq.first(15)
    end
  end

  # Méthode pour formater la commune pour l'affichage dans l'autocomplétion
  def display_name
    "#{libgeo} (#{codgeo}) - Dép. #{dep}"
  end

  private

  # Vérifie si nous utilisons PostgreSQL - maintenant défini comme méthode de classe
  def self.using_postgres?
    connection.adapter_name.downcase.include?('postgresql')
  end
end
