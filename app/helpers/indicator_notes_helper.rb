# Définition et intérêt de chaque indicateur des tableaux de bord (communes et EPCI), repliés derrière deux liens
# discrets « ⓘ Définition » et « ◎ Intérêt ». Textes : config/indicator_notes.yml (clé = value_key de l'indicateur ou
# titre « parameterize ») ; la définition passée par la vue l'emporte sur celle du fichier.
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

  # key : clé du catalogue (ou plusieurs, la première trouvée l'emporte) ; definition / interest : textes de la vue ;
  # bloc : définition en HTML (texte avec ERB de la vue), prioritaire sur definition:
  def indicator_notes(*keys, definition: nil, interest: nil, style: nil, &block)
    definition = capture(&block) if block
    n = indicator_note(*keys)
    texts = [["def", "ⓘ Définition", definition.presence || n["definition"]],
             ["use", "◎ Intérêt", interest.presence || n["interest"]]].select { |_, _, t| t.present? }
    return "".html_safe if texts.empty?

    toggle = "var w=this.closest('[data-ind-notes]'),k=this.getAttribute('data-note-btn'),p=w.querySelector('[data-note='+k+']')," \
             "o=p.style.display==='none';w.querySelectorAll('[data-note]').forEach(function(e){e.style.display='none'});" \
             "w.querySelectorAll('[data-note-btn]').forEach(function(b){b.style.textDecoration='none'});" \
             "if(o){p.style.display='';this.style.textDecoration='underline'}"
    btn = "background:none;border:none;padding:0;cursor:pointer;color:#4f46e5;font-size:12px;text-underline-offset:3px"
    panel = "display:none;margin-top:6px;padding:6px 10px;border-left:2px solid #c7d2fe;background:#f8fafc;" \
            "font-size:12px;line-height:1.5;color:#4b5563;max-width:80ch"
    content_tag(:div, data: { ind_notes: "" }, style: style || "margin:0 0 12px") do
      safe_join([
        content_tag(:div, style: "display:flex;flex-wrap:wrap;gap:14px") do
          safe_join(texts.map { |k, label, _| content_tag(:button, label, type: "button", data: { note_btn: k }, onclick: toggle, style: btn) })
        end,
        *texts.map { |k, _, t| content_tag(:div, epci_wording(t.is_a?(ActiveSupport::SafeBuffer) ? t : t.to_s), data: { note: k }, style: panel) }
      ])
    end
  end
end
