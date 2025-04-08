# lib/tasks/import_geometries.rake
namespace :import do
  desc "Import commune geometries from GeoJSON file"
  task commune_geometries: :environment do
    require 'json'

    puts "Starting import of commune geometries..."

    file_path = Rails.root.join('db', 'data', 'communes.geojson')
    geojson = JSON.parse(File.read(file_path))

    # Compteurs pour le reporting
    total = geojson['features'].count
    imported = 0
    skipped = 0

    geojson['features'].each do |feature|
      code_insee = feature['properties']['com_code']&.first
      nom = feature['properties']['com_name']&.first || feature['properties']['com_name']

      if code_insee.blank?
        skipped += 1
        puts "\nSkipped (no code_insee): #{feature['properties'].inspect}"
        next
      end

      territory = Territory.find_by(codgeo: code_insee)
      epci = territory&.epci

      geometry = CommuneGeometry.find_or_initialize_by(code_insee: code_insee)

      if geometry.new_record? || geometry.geojson.nil?
        geometry.nom = nom
        geometry.epci = epci
        geometry.geojson = feature['geometry'].to_json

        if geometry.save
          imported += 1
          print "." if imported % 100 == 0
        else
          skipped += 1
          puts "\nSkipped: #{code_insee} - #{geometry.errors.full_messages.join(', ')}"
        end
      else
        skipped += 1
      end
    end


    puts "\nImport completed!"
    puts "Total: #{total}, Imported: #{imported}, Skipped: #{skipped}"
  end
end
