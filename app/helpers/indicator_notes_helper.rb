# Définition, intérêt et source de chaque indicateur des tableaux de bord (communes et EPCI), repliés derrière des
# liens discrets « ⓘ Définition », « ◎ Intérêt » et « Source ». Textes : config/indicator_notes.yml (clé = value_key de
# l'indicateur, « onglet__bloc » ou titre « parameterize ») ; la définition passée par la vue l'emporte sur celle du
# fichier. Source : modèle de la section « _sources » (ou texte libre) où « %{years} » prend les millésimes affichés.
module IndicatorNotesHelper
  NOTES_PATH = Rails.root.join("config/indicator_notes.yml")

  def indicator_notes_catalog
    @indicator_notes_catalog ||= (YAML.load_file(NOTES_PATH) rescue {}) || {}
  end

  def indicator_note(*keys)
    keys.compact.map(&:to_s).reject(&:blank?).each do |k|
      slug = k.unicode_normalize(:nfkd).gsub(/[^\x00-\x7F]/, "").downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-|-\z/, "")
      n = indicator_notes_catalog[k] || indicator_notes_catalog[slug]
      return n if n
    end
    {}
  end

  # Millésimes : « 2023 » ; « 2016 à 2025 » pour une suite annuelle ; « 2012, 2017 et 2023 » sinon
  def indicator_years_label(years)
    return years.to_s if years.is_a?(String)
    ys = Array(years).compact.map(&:to_s).reject(&:blank?).uniq.sort
    return nil if ys.empty?
    return ys.first if ys.size == 1
    ints = ys.map(&:to_i)
    return "#{ys.first} à #{ys.last}" if ys.size > 2 && ints.each_cons(2).all? { |a, b| b - a <= 2 }
    "#{ys[0..-2].join(', ')} et #{ys.last}"
  end

  def indicator_source(source, years)
    return nil if source.blank?
    tpl = (indicator_notes_catalog["_sources"] || {})[source.to_s] || source.to_s
    label = indicator_years_label(years)
    text = label ? tpl.gsub("%{years}", label) : tpl.gsub(/\s*%\{years\}/, "")
    text.gsub(/\s+([,.;)])/, '\1').strip
  end

  # key : clé du catalogue (ou plusieurs, la première trouvée l'emporte) ; definition / interest : textes de la vue ;
  # bloc : définition en HTML (texte avec ERB de la vue), prioritaire sur definition:
  # years : millésimes affichés (tableau, ou texte tel quel : « 2016 à 2025 ») ; source : texte ou modèle de _sources.
  # Rend « Définition » et « Intérêt » sous le titre ; la source est gardée pour indicator_source_note, appelé en bas
  # du bloc (sous le graphique, le tableau ou la carte).
  def indicator_notes(*keys, definition: nil, interest: nil, source: nil, years: nil, style: nil, &block)
    definition = capture(&block) if block
    n = indicator_note(*keys)
    @indicator_source_pending = indicator_source(source.presence || n["source"], years)
    indicator_notes_widget([["def", "ⓘ Définition", definition.presence || n["definition"]],
                            ["use", "◎ Intérêt", interest.presence || n["interest"]]], style: style || "margin:0 0 12px")
  end

  # Lien « Source » en bas du bloc : source du dernier indicator_notes (ou texte / modèle passé, avec years:)
  # bloc : texte complet de la source (HTML avec ERB de la vue), prioritaire
  def indicator_source_note(source = nil, years: nil, style: nil, &block)
    text = if block then capture(&block)
           elsif source then indicator_source(source, years)
           else
             pending, @indicator_source_pending = @indicator_source_pending, nil
             pending
           end
    indicator_notes_widget([["src", "⊙ Source", text]], style: style || "margin:10px 0 0", muted: true)
  end

  # Cartes (IRIS, communes d'un EPCI, carreaux, localisation) : définition et intérêt de la carte, sans modifier la
  # source en attente du bloc qui l'englobe. Intérêt : entrée « map__<indicateur> » du catalogue, sinon texte générique.
  MAP_INTEREST = {
    iris: "La carte révèle les écarts entre quartiers que la moyenne communale masque : elle repère les secteurs où " \
          "l'enjeu se concentre, pour cibler les actions (quartiers prioritaires, permanences, démarches d'aller-vers) " \
          "et nourrir le diagnostic de quartier.",
    communes: "La carte compare les communes de l'intercommunalité entre elles : elle repère celles où l'enjeu est le " \
              "plus marqué, pour territorialiser les actions et la répartition des services.",
    grid: "Le carroyage de 1 km affine la lecture au-delà des limites administratives : il montre les poches de " \
          "fragilité ou d'aisance à l'intérieur de la commune, y compris là où il n'y a pas d'IRIS.",
    points: "Localiser les équipements et services permet de repérer les secteurs bien desservis et ceux qui en sont " \
            "éloignés, d'apprécier l'accessibilité pour les habitants peu mobiles et d'identifier les partenaires de proximité."
  }.freeze

  # Intérêt : « map__<indicateur> » (cartes IRIS et carreaux), « map__points_<groupe> » (localisation),
  # « map_communes__<indicateur> » (communes d'un EPCI ; à défaut, intérêt de l'indicateur précédé d'une phrase sur la
  # comparaison des communes), puis texte générique du type de carte.
  def map_notes(kind, indicator_key: nil, definition: nil, style: nil)
    interest = nil
    if kind == :communes
      interest = indicator_note("map_communes__#{indicator_key}")["interest"] if indicator_key
      base = indicator_key && indicator_note(indicator_key)["interest"]
      interest ||= "Comparer les communes de l'intercommunalité permet de repérer celles où l'enjeu est le plus marqué. #{base}" if base.present?
    elsif indicator_key
      interest = indicator_note("map__#{indicator_key}")["interest"]
    end
    indicator_notes_widget([["def", "ⓘ Définition", definition.presence],
                            ["use", "◎ Intérêt", interest.presence || MAP_INTEREST[kind]]],
                           style: style || "margin:0 0 10px")
  end

  def indicator_notes_widget(texts, style:, muted: false)
    texts = texts.select { |_, _, t| t.present? }
    return "".html_safe if texts.empty?

    toggle = "var w=this.closest('[data-ind-notes]'),k=this.getAttribute('data-note-btn'),p=w.querySelector('[data-note='+k+']')," \
             "o=p.style.display==='none';w.querySelectorAll('[data-note]').forEach(function(e){e.style.display='none'});" \
             "w.querySelectorAll('[data-note-btn]').forEach(function(b){b.style.textDecoration='none'});" \
             "if(o){p.style.display='';this.style.textDecoration='underline'}"
    btn = "background:none;border:none;padding:0;cursor:pointer;color:#{muted ? '#6b7280' : '#4f46e5'};font-size:12px;text-underline-offset:3px"
    panel = "display:none;margin-top:6px;padding:6px 10px;border-left:2px solid #{muted ? '#e5e7eb' : '#c7d2fe'};background:#f8fafc;" \
            "font-size:12px;line-height:1.5;color:#4b5563;max-width:80ch"
    content_tag(:div, data: { ind_notes: "" }, style: style) do
      safe_join([
        content_tag(:div, style: "display:flex;flex-wrap:wrap;gap:14px") do
          safe_join(texts.map { |k, label, _| content_tag(:button, label, type: "button", data: { note_btn: k }, onclick: toggle, style: btn) })
        end,
        *texts.map { |k, _, t| content_tag(:div, epci_wording(t.is_a?(ActiveSupport::SafeBuffer) ? t : t.to_s), data: { note: k }, style: panel) }
      ])
    end
  end
end
