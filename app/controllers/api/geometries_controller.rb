module Api
  class GeometriesController < ApplicationController
    include UserAuthorization

    def communes_by_epci
      # Vérifier que l'utilisateur a accès à cet EPCI
      unless current_user.super_admin? || current_user.territory_code == params[:epci_code]
        return render json: { error: "Unauthorized" }, status: :unauthorized
      end

      # Récupérer les géométries des communes de l'EPCI
      geometries = CommuneGeometry.where(epci: params[:epci_code])

      # Récupérer les données démographiques
      epci_communes_data = Api::EpciCommunesService.get_children_by_communes(params[:epci_code])

      # Préparer le GeoJSON
      features = []

      geometries.each do |geometry|
        # Trouver les données démographiques correspondantes
        commune_data = epci_communes_data["communes"].find { |c| c["code"] == geometry.code_insee }
        next unless commune_data && geometry.geojson.present?

        feature = {
          type: "Feature",
          properties: {
            code: geometry.code_insee,
            name: geometry.nom,
            under3_rate: commune_data["under_3_rate"],
            children_under3: commune_data["children_under_3"].round,
            population: commune_data["total_population"].round
          },
          geometry: JSON.parse(geometry.geojson)
        }

        features << feature
      end

      geojson = {
        type: "FeatureCollection",
        features: features
      }

      render json: geojson
    end
  end
end
