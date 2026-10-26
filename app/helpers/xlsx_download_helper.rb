# Bouton « Télécharger (Excel) » : les données sont préparées côté serveur (lignes) et le fichier est généré dans
# le navigateur par le contrôleur Stimulus xlsx-download (SheetJS chargé au premier clic, pas de nouvelle route).
module XlsxDownloadHelper
  LEVEL_LABELS = { commune: "Commune", epci: "EPCI", department: "Département", region: "Région", france: "France" }.freeze

  def xlsx_level(territory)
    LEVEL_LABELS[territory[:key]] || territory[:key].to_s
  end

  def xlsx_filename(*parts)
    base = [@territory_name, *parts].compact.join(" - ")
    "#{base.gsub(%r{[/\\:*?"<>|]}, '-').squeeze(' ').strip[0, 120]}.xlsx"
  end

  # sheets : [{ name:, rows: [[...], ...], widths: [..] }] ; notes : lignes de texte ajoutées dans un onglet « Notes »
  def xlsx_download_button(filename:, sheets:, notes: [])
    notes = Array(notes).compact
    sheets += [{ name: "Notes", rows: notes.map { |n| [n] }, widths: [120] }] if notes.any?
    payload = { filename: filename, sheets: sheets }
    content_tag(:span, data: { controller: "xlsx-download", xlsx_download_payload_value: payload.to_json }) do
      content_tag(:button, type: "button", data: { action: "click->xlsx-download#download" },
                  title: "Télécharger les données au format Excel",
                  style: "display:inline-flex;align-items:center;gap:4px;padding:3px 9px;font-size:11px;border:1px solid #c7d2fe;border-radius:8px;background:#fff;color:#4338ca;cursor:pointer;white-space:nowrap") do
        safe_join([content_tag(:span, "⬇"), "Excel"])
      end
    end
  end

  def xlsx_number(v)
    v.nil? ? nil : v.to_f.round(2)
  end
end
