import { Controller } from "@hotwired/stimulus"

// Téléchargement Excel des données d'un indicateur, généré dans le navigateur (SheetJS, chargé au premier clic).
// data-xlsx-download-payload-value = { filename, sheets: [{ name, rows: [[en-têtes], [valeurs]...], widths: [..] }] }
export default class extends Controller {
  static values = { payload: Object }

  async download(event) {
    event.preventDefault()
    const button = event.currentTarget
    const label = button.innerHTML
    button.innerHTML = "…"
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()
      for (const sheet of this.payloadValue.sheets || []) {
        const ws = XLSX.utils.aoa_to_sheet(sheet.rows)
        if (sheet.widths) ws["!cols"] = sheet.widths.map((w) => ({ wch: w }))
        XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
      }
      XLSX.writeFile(wb, this.payloadValue.filename)
    } catch (e) {
      console.error("Export Excel impossible", e)
      alert("Le téléchargement a échoué. Vérifiez votre connexion et réessayez.")
    } finally {
      button.innerHTML = label
    }
  }
}
