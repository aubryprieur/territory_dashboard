class EpcisController < ApplicationController
  include UserAuthorization

  def requires_super_admin?
    true
  end

  def autocomplete
    term = params[:term].to_s

    query = Epci.all

    if term.present?
      if ActiveRecord::Base.connection.adapter_name.downcase.include?('postgresql')
        query = query.where("unaccent(lower(libepci)) LIKE unaccent(lower(?)) OR epci LIKE ?",
                       "%#{term}%", "%#{term}%")
      else
        query = query.where("lower(libepci) LIKE ? OR epci LIKE ?",
                       "%#{term.downcase}%", "%#{term}%")
      end
    end

    @epcis = query.limit(15)

    respond_to do |format|
      format.json {
        render json: @epcis.map { |e|
          {
            id: e.id,
            label: "#{e.libepci} (#{e.epci}) - #{e.nature_epci}",
            value: e.libepci,
            display_value: "#{e.libepci} (#{e.epci}) - #{e.nature_epci}",
            epci_code: e.epci,
            name: e.libepci,
            exact_match: e.libepci.downcase == params[:term].to_s.downcase
          }
        }
      }
    end
  end
end
