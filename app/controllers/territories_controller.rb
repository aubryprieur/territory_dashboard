class TerritoriesController < ApplicationController
  include UserAuthorization

  def requires_super_admin?
    true
  end

  def autocomplete
    @territories = Territory.search(params[:term])

    respond_to do |format|
      format.json {
        render json: @territories.map { |t|
          {
            id: t.id,
            label: "#{t.libgeo} (#{t.codgeo}) - Dép. #{t.dep}",
            value: t.libgeo,
            display_value: "#{t.libgeo} (#{t.codgeo}) - Dép. #{t.dep}",
            codgeo: t.codgeo,
            epci: t.epci,
            dep: t.dep,
            reg: t.reg
          }
        }
      }
    end
  end
end
