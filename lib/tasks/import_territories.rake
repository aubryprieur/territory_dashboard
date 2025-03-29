namespace :data do
  desc "Import territories data from Excel file"
  task import_territories: :environment do
    require 'roo'

    puts "Starting territories import..."

    # S'assurer que le fichier existe
    file_path = Rails.root.join('db', 'data', 'territories.xlsx')
    unless File.exist?(file_path)
      puts "Error: File not found at #{file_path}"
      puts "Please place your Excel file in the db/data directory"
      exit
    end

    # Ouvrir le fichier Excel - spécifier explicitement le type
    puts "Opening Excel file..."
    spreadsheet = Roo::Excelx.new(file_path.to_s)
    header = spreadsheet.row(1)

    # Vérifier que les colonnes attendues sont présentes
    required_columns = ["LIBGEO", "CODGEO", "EPCI", "DEP", "REG"]
    missing_columns = required_columns - header

    if missing_columns.any?
      puts "Error: Missing required columns: #{missing_columns.join(', ')}"
      exit
    end

    # Nombre total de lignes à traiter
    total_rows = spreadsheet.last_row - 1
    puts "Found #{total_rows} territories to import"

    # Supprimer les territoires existants pour éviter les doublons
    puts "Clearing existing territories..."
    Territory.delete_all

    # Utiliser la méthode de traitement par lots pour améliorer les performances
    puts "Importing territories in batches..."

    batch_size = 1000
    territories_data = []
    start_time = Time.now
    error_count = 0

    # Traiter chaque ligne à partir de la deuxième (après l'en-tête)
    (2..spreadsheet.last_row).each_with_index do |i, index|
      row = Hash[[header, spreadsheet.row(i)].transpose]

      # Préparer les données du territoire
      territories_data << {
        libgeo: row["LIBGEO"],
        codgeo: row["CODGEO"]&.to_s,
        epci: row["EPCI"]&.to_s,
        dep: row["DEP"]&.to_s,
        reg: row["REG"]&.to_s,
        created_at: Time.now,
        updated_at: Time.now
      }

      # Afficher la progression tous les 5%
      if (index + 1) % [total_rows / 20, 1].max == 0
        percent_complete = ((index + 1).to_f / total_rows * 100).round(1)
        elapsed = Time.now - start_time
        rate = (index + 1) / elapsed
        estimated_total = total_rows / rate
        remaining = estimated_total - elapsed

        puts "Progress: #{percent_complete}% (#{index + 1}/#{total_rows}) - " \
             "#{rate.round(1)} records/sec - " \
             "Est. remaining: #{format_time(remaining)}"
      end

      # Importer par lots pour améliorer les performances
      if territories_data.size >= batch_size || i == spreadsheet.last_row
        begin
          # Import en masse avec insert_all
          Territory.insert_all(territories_data)
          territories_data = []
        rescue => e
          error_count += territories_data.size
          puts "Error during batch import: #{e.message}"
          territories_data = []
        end
      end
    end

    total_time = Time.now - start_time
    puts "Import completed in #{format_time(total_time)}."
    puts "Total: #{Territory.count} territories imported."
    puts "Errors: #{error_count} territories failed to import." if error_count > 0
  end

  def format_time(seconds)
    minutes = (seconds / 60).to_i
    seconds = (seconds % 60).round

    if minutes > 0
      "#{minutes}m #{seconds}s"
    else
      "#{seconds}s"
    end
  end
end
