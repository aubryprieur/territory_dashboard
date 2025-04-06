namespace :data do
  desc "Import EPCI data from Excel file"
  task import_epcis: :environment do
    require 'roo'

    puts "Starting EPCI import..."

    # S'assurer que le fichier existe
    file_path = Rails.root.join('db', 'data', 'epcis.xlsx')
    unless File.exist?(file_path)
      puts "Error: File not found at #{file_path}"
      puts "Please place your Excel file in the db/data directory"
      exit
    end

    # Ouvrir le fichier Excel
    puts "Opening Excel file..."
    spreadsheet = Roo::Excelx.new(file_path.to_s)
    header = spreadsheet.row(1)

    # Vérifier que les colonnes attendues sont présentes
    required_columns = ["EPCI", "LIBEPCI", "NATURE_EPCI", "NB_COM"]
    missing_columns = required_columns - header

    if missing_columns.any?
      puts "Error: Missing required columns: #{missing_columns.join(', ')}"
      exit
    end

    # Nombre total de lignes à traiter
    total_rows = spreadsheet.last_row - 1
    puts "Found #{total_rows} EPCIs to import"

    # Supprimer les EPCIs existants pour éviter les doublons
    puts "Clearing existing EPCIs..."
    Epci.delete_all

    # Traiter chaque ligne à partir de la deuxième (après l'en-tête)
    import_count = 0
    error_count = 0

    (2..spreadsheet.last_row).each do |i|
      row = Hash[[header, spreadsheet.row(i)].transpose]

      # Préparer les données de l'EPCI
      epci_data = {
        epci: row["EPCI"].to_s,
        libepci: row["LIBEPCI"],
        nature_epci: row["NATURE_EPCI"],
        nb_com: row["NB_COM"].to_i
      }

      # Créer l'EPCI
      begin
        Epci.create!(epci_data)
        import_count += 1
      rescue => e
        error_count += 1
        puts "Error importing row #{i}: #{e.message}"
      end

      # Afficher la progression tous les 100 EPCIs
      if i % 100 == 0 || i == spreadsheet.last_row
        percent_complete = ((i - 1).to_f / total_rows * 100).round(1)
        puts "Progress: #{percent_complete}% (#{i-1}/#{total_rows})"
      end
    end

    puts "Import completed."
    puts "Total: #{import_count} EPCIs imported successfully."
    puts "Errors: #{error_count} EPCIs failed to import."

    # Vérifier les territoires qui matchent avec un EPCI
    matching_territories = Territory.joins("INNER JOIN epcis ON territories.epci = epcis.epci").count
    total_territories_with_epci = Territory.where.not(epci: nil).count

    puts "Territory matches: #{matching_territories}/#{total_territories_with_epci} territories with EPCI code match with imported EPCIs"
  end
end
