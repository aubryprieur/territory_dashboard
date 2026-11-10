# Mise en récit des onglets : sommaire des questions et en-tête de question (l'encadré « À retenir » a été retiré :
# redondant avec le bloc des rangs et l'onglet Synthèse).
module TabStoryHelper
  # Tableau de bord EPCI : « la commune » devient « l'intercommunalité » dans les textes des onglets
  def la_commune(cap: false)
    w = @epci_mode ? "l'intercommunalité" : "la commune"
    cap ? w.sub(/\A./, &:upcase) : w
  end

  # Questions, intros et titres des onglets : formulation adaptée au tableau de bord EPCI
  def epci_wording(text)
    return text unless @epci_mode && text.is_a?(String)
    out = text.gsub("La commune", "L'intercommunalité").gsub("la commune", "l'intercommunalité")
              .gsub("dans quels quartiers", "dans quelles communes")
    text.html_safe? ? out.html_safe : out
  end

  # questions : [[id, "Question ?"], ...]
  def story_summary(questions)
    content_tag(:nav, class: "text-sm", style: "display:flex;flex-wrap:wrap;gap:8px;margin:0 0 1.5rem") do
      safe_join(questions.each_with_index.map do |(id, q), i|
        content_tag(:button, "#{i + 1}. #{epci_wording(q)}", type: "button",
                    onclick: "document.getElementById('#{id}').scrollIntoView({behavior:'smooth',block:'start'})",
                    style: "padding:6px 12px;border:1px solid #c7d2fe;border-radius:999px;background:#fff;color:#3730a3;cursor:pointer;font-size:13px")
      end)
    end
  end

  # Carte d'une question : <%= story_card("q-housing-1", 1, "De quels logements dispose la commune ?", "intro") do %> … <% end %>
  def story_card(id, number, question, intro = nil, &block)
    content_tag(:div, id: id, class: "bg-white shadow rounded-lg p-6 mb-6", style: "scroll-margin-top:90px") do
      safe_join([
        content_tag(:h2, "#{number}. #{epci_wording(question)}", class: "text-lg font-medium text-gray-900 mb-1"),
        (intro ? content_tag(:p, epci_wording(intro), class: "text-xs text-gray-500 mb-4") : nil),
        capture(&block)
      ].compact)
    end
  end
end
