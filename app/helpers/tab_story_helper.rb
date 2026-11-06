# Mise en récit des onglets : sommaire des questions, en-tête de question, encadré « À retenir » généré à partir des
# rangs de la synthèse (FragilityIntensityHelper, rang dans la catégorie de densité).
module TabStoryHelper
  # questions : [[id, "Question ?"], ...]
  def story_summary(questions)
    content_tag(:nav, class: "text-sm", style: "display:flex;flex-wrap:wrap;gap:8px;margin:0 0 1.5rem") do
      safe_join(questions.each_with_index.map do |(id, q), i|
        content_tag(:button, "#{i + 1}. #{q}", type: "button",
                    onclick: "document.getElementById('#{id}').scrollIntoView({behavior:'smooth',block:'start'})",
                    style: "padding:6px 12px;border:1px solid #c7d2fe;border-radius:999px;background:#fff;color:#3730a3;cursor:pointer;font-size:13px")
      end)
    end
  end

  # Carte d'une question : <%= story_card("q-housing-1", 1, "De quels logements dispose la commune ?", "intro") do %> … <% end %>
  def story_card(id, number, question, intro = nil, &block)
    content_tag(:div, id: id, class: "bg-white shadow rounded-lg p-6 mb-6", style: "scroll-margin-top:90px") do
      safe_join([
        content_tag(:h2, "#{number}. #{question}", class: "text-lg font-medium text-gray-900 mb-1"),
        (intro ? content_tag(:p, intro, class: "text-xs text-gray-500 mb-4") : nil),
        capture(&block)
      ].compact)
    end
  end

  def story_value(item, v)
    return "–" if v.nil?
    case item["unit"]
    when "%" then fmt_pct(v)
    when "€" then "#{fmt_count(v)} €"
    when "‰" then "#{fmt_decimal(v, precision: 1)} ‰"
    when "%/an" then "#{v.positive? ? '+' : ''}#{fmt_decimal(v, precision: 2)} %/an"
    else fmt_decimal(v, precision: 1)
    end
  end

  # « À retenir » : intensité de l'enjeu de l'onglet, indicateurs les plus marqués (intensité ≥ 60) et le moins marqué
  def story_highlights(tab, max: 3)
    syn = @fragility_synthesis.is_a?(Hash) && @fragility_synthesis["error"].blank? ? @fragility_synthesis : nil
    return nil unless syn
    by_key = (syn["indicators"].to_a + syn["context_indicators"].to_a).index_by { |i| i["key"] }
    items = (syn.dig("tab_keys", tab) || []).filter_map { |k| by_key[k] }
    return nil if items.empty?
    rank = ->(i) { i["rank_density"] || i["rank_france"] }
    scored = items.reject { |i| i["value"].nil? || rank.(i).nil? }.map { |i| [i, enjeu_intensity(i, rank.(i))] }
    level = enjeu_level(items.map { |i| i["value"].nil? ? nil : enjeu_intensity(i, rank.(i)) }, items.size)
    line = lambda do |i, x|
      ref = i["france_value"] ? " (France : #{story_value(i, i['france_value'])})" : ""
      "#{i['label']} : #{story_value(i, i['value'])}#{ref} — #{enjeu_position_text(i, rank.(i))}"
    end
    strong = scored.select { |_, x| x >= 60 }.sort_by { |_, x| -x }.first(max).map { |i, x| line.(i, x) }
    weak = scored.select { |_, x| x <= 25 }.min_by { |_, x| x }
    { level: level, density: syn.dig("density", "label"), strong: strong, weak: weak && line.(*weak) }
  end

  def story_takeaways(tab, title: "À retenir")
    h = story_highlights(tab)
    return "" if h.nil? || (h[:strong].empty? && h[:weak].nil?)
    lvl, bg, fg = enjeu_level_badge(h[:level])
    content_tag(:div, style: "margin:0 0 1.5rem;padding:14px 18px;border-left:4px solid #6366f1;background:#eef2ff;border-radius:8px", class: "text-sm text-gray-800") do
      safe_join([
        content_tag(:div, style: "display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:6px") do
          safe_join([content_tag(:strong, title),
                     (lvl ? content_tag(:span, lvl, style: "padding:1px 8px;border-radius:999px;font-size:12px;background:#{bg};color:#{fg}") : nil),
                     content_tag(:span, (@epci_mode ? "par rapport aux EPCI de même nature (#{h[:density] || 'nature inconnue'})" : "par rapport aux communes de même densité (#{h[:density] || 'catégorie inconnue'})"), class: "text-xs text-gray-500")].compact)
        end,
        (h[:strong].any? ? content_tag(:ul, safe_join(h[:strong].map { |t| content_tag(:li, t) }), style: "margin:0 0 4px 18px;list-style:disc") : nil),
        (h[:weak] ? content_tag(:p, "Enjeu moins marqué qu'ailleurs : #{h[:weak]}", class: "text-gray-600", style: "margin-top:4px") : nil)
      ].compact)
    end
  end
end
