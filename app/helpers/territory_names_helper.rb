module TerritoryNamesHelper
  # Récupère le nom de l'EPCI depuis la base de données
  def epci_display_name
    if defined?(@epci_code) && @epci_code.present?
      epci_record = Epci.find_by(epci: @epci_code)
      return epci_record.libepci if epci_record&.libepci.present?
      return "EPCI #{@epci_code}"
    end
    'EPCI'
  end

  # Récupère le nom du département depuis la base de données ou mapping
  def department_display_name
    # ✅ CORRECTION : Utiliser @main_department_code pour le dashboard EPCI
    department_code = defined?(@main_department_code) ? @main_department_code : @department_code

    # D'abord essayer de récupérer depuis les données API si disponibles
    return @department_revenue_data['name'] if defined?(@department_revenue_data) && @department_revenue_data&.dig('name').present?
    return @department_children_data['name'] if defined?(@department_children_data) && @department_children_data&.dig('name').present?

    # Sinon utiliser le mapping avec le code
    if department_code.present?
      return department_name_from_code(department_code)
    end

    'Département'
  end

  # Récupère le nom de la région depuis la base de données ou mapping
  def region_display_name
    # ✅ CORRECTION : Utiliser @main_region_code pour le dashboard EPCI
    region_code = defined?(@main_region_code) ? @main_region_code : @region_code

    # D'abord essayer de récupérer depuis les données API si disponibles
    return @region_revenue_data['name'] if defined?(@region_revenue_data) && @region_revenue_data&.dig('name').present?
    return @region_children_data['name'] if defined?(@region_children_data) && @region_children_data&.dig('name').present?

    # Sinon utiliser le mapping avec le code
    if region_code.present?
      return region_name_from_code(region_code)
    end

    'Région'
  end

  private

  # Mapping simplifié des codes départements vers leurs noms
  def department_name_from_code(code)
    department_names = {
      '01' => 'Ain', '02' => 'Aisne', '03' => 'Allier', '04' => 'Alpes-de-Haute-Provence',
      '05' => 'Hautes-Alpes', '06' => 'Alpes-Maritimes', '07' => 'Ardèche', '08' => 'Ardennes',
      '09' => 'Ariège', '10' => 'Aube', '11' => 'Aude', '12' => 'Aveyron',
      '13' => 'Bouches-du-Rhône', '14' => 'Calvados', '15' => 'Cantal', '16' => 'Charente',
      '17' => 'Charente-Maritime', '18' => 'Cher', '19' => 'Corrèze', '20' => 'Corse',
      '21' => 'Côte-d\'Or', '22' => 'Côtes-d\'Armor', '23' => 'Creuse', '24' => 'Dordogne',
      '25' => 'Doubs', '26' => 'Drôme', '27' => 'Eure', '28' => 'Eure-et-Loir',
      '29' => 'Finistère', '30' => 'Gard', '31' => 'Haute-Garonne', '32' => 'Gers',
      '33' => 'Gironde', '34' => 'Hérault', '35' => 'Ille-et-Vilaine', '36' => 'Indre',
      '37' => 'Indre-et-Loire', '38' => 'Isère', '39' => 'Jura', '40' => 'Landes',
      '41' => 'Loir-et-Cher', '42' => 'Loire', '43' => 'Haute-Loire', '44' => 'Loire-Atlantique',
      '45' => 'Loiret', '46' => 'Lot', '47' => 'Lot-et-Garonne', '48' => 'Lozère',
      '49' => 'Maine-et-Loire', '50' => 'Manche', '51' => 'Marne', '52' => 'Haute-Marne',
      '53' => 'Mayenne', '54' => 'Meurthe-et-Moselle', '55' => 'Meuse', '56' => 'Morbihan',
      '57' => 'Moselle', '58' => 'Nièvre', '59' => 'Nord', '60' => 'Oise',
      '61' => 'Orne', '62' => 'Pas-de-Calais', '63' => 'Puy-de-Dôme', '64' => 'Pyrénées-Atlantiques',
      '65' => 'Hautes-Pyrénées', '66' => 'Pyrénées-Orientales', '67' => 'Bas-Rhin',
      '68' => 'Haut-Rhin', '69' => 'Rhône', '70' => 'Haute-Saône', '71' => 'Saône-et-Loire',
      '72' => 'Sarthe', '73' => 'Savoie', '74' => 'Haute-Savoie', '75' => 'Paris',
      '76' => 'Seine-Maritime', '77' => 'Seine-et-Marne', '78' => 'Yvelines', '79' => 'Deux-Sèvres',
      '80' => 'Somme', '81' => 'Tarn', '82' => 'Tarn-et-Garonne', '83' => 'Var',
      '84' => 'Vaucluse', '85' => 'Vendée', '86' => 'Vienne', '87' => 'Haute-Vienne',
      '88' => 'Vosges', '89' => 'Yonne', '90' => 'Territoire de Belfort', '91' => 'Essonne',
      '92' => 'Hauts-de-Seine', '93' => 'Seine-Saint-Denis', '94' => 'Val-de-Marne',
      '95' => 'Val-d\'Oise', '971' => 'Guadeloupe', '972' => 'Martinique', '973' => 'Guyane',
      '974' => 'La Réunion', '976' => 'Mayotte'
    }

    name = department_names[code] || "Département #{code}"
    "#{name} (#{code})"
  end

  # Mapping simplifié des codes régions vers leurs noms
  def region_name_from_code(code)
    region_names = {
      '01' => 'Guadeloupe', '02' => 'Martinique', '03' => 'Guyane', '04' => 'La Réunion',
      '06' => 'Mayotte', '11' => 'Île-de-France', '24' => 'Centre-Val de Loire',
      '27' => 'Bourgogne-Franche-Comté', '28' => 'Normandie', '32' => 'Hauts-de-France',
      '44' => 'Grand Est', '52' => 'Pays de la Loire', '53' => 'Bretagne',
      '75' => 'Nouvelle-Aquitaine', '76' => 'Occitanie', '84' => 'Auvergne-Rhône-Alpes',
      '93' => 'Provence-Alpes-Côte d\'Azur', '94' => 'Corse'
    }

    name = region_names[code] || "Région #{code}"
    "#{name} (#{code})"
  end

  def display_territory_name(name, max_length = 30)
    return name if name.length <= max_length

    # Essayer de couper intelligemment
    if name.include?('Communauté')
      # Abbréger les EPCI
      abbreviated = name
        .gsub(/Communauté d'agglomération/, 'CA')
        .gsub(/Communauté de communes/, 'CC')
        .gsub(/Communauté urbaine/, 'CU')

      return abbreviated if abbreviated.length <= max_length
    end

    # Sinon troncature intelligente
    truncated = name[0, max_length]
    last_space = truncated.rindex(' ')

    if last_space && last_space > max_length * 0.7
      "#{truncated[0, last_space]}..."
    else
      "#{truncated}..."
    end
  end
end
