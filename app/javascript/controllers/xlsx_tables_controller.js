import { Controller } from "@hotwired/stimulus"

// Bouton « Excel » ajouté automatiquement au-dessus de chaque tableau de données des onglets qui n'a pas
// d'export préparé côté serveur (tableaux marqués data-xlsx-skip : indicateurs génériques, IRIS, fragilités).
// Le tableau est exporté tel qu'affiché (lignes x colonnes), les nombres français convertis en nombres Excel.
// Les onglets étant injectés à la volée, un MutationObserver relance le repérage.
export default class extends Controller {
  static values = { territory: String }

  connect() {
    this.scan()
    this.observer = new MutationObserver(() => {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.scan(), 150)
    })
    this.observer.observe(this.element, { childList: true, subtree: true })
  }

  disconnect() {
    this.observer?.disconnect()
    clearTimeout(this.timer)
  }

  scan() {
    this.element.querySelectorAll("table:not([data-xlsx-skip]):not([data-xlsx-bound])").forEach((table) => {
      if (!table.querySelector("tbody tr")) return
      table.dataset.xlsxBound = "1"
      const title = this.titleFor(table)
      const bar = document.createElement("div")
      bar.style.cssText = "display:flex;justify-content:flex-end;margin:0 0 6px"
      const button = document.createElement("button")
      button.type = "button"
      button.title = "Télécharger les données au format Excel"
      button.style.cssText = "display:inline-flex;align-items:center;gap:4px;padding:3px 9px;font-size:11px;border:1px solid #c7d2fe;border-radius:8px;background:#fff;color:#4338ca;cursor:pointer;white-space:nowrap"
      button.innerHTML = "<span>⬇</span>Excel"
      button.addEventListener("click", (e) => this.download(e, table, title))
      bar.appendChild(button)
      const anchor = table.closest(".overflow-x-auto") || table
      anchor.parentNode.insertBefore(bar, anchor)
    })
  }

  // Titre : le h2/h3/h4 le plus proche avant le tableau dans ses conteneurs successifs
  titleFor(table) {
    let node = table
    while (node && node !== this.element) {
      let prev = node.previousElementSibling
      while (prev) {
        const h = prev.matches("h2,h3,h4") ? prev : prev.querySelector("h2,h3,h4")
        if (h && h.textContent.trim()) return h.textContent.trim().replace(/\s+/g, " ")
        prev = prev.previousElementSibling
      }
      node = node.parentElement
    }
    return "Données"
  }

  cellValue(cell) {
    const text = cell.textContent.replace(/\s+/g, " ").trim()
    if (text === "" || text === "–" || text === "-") return null
    const m = text.match(/^([+\-−]?)(\d{1,3}(?:[   ]\d{3})*|\d+)(?:,(\d+))?\s*(%|€|pts?|points)?$/)
    if (!m) return text
    const n = parseFloat(`${m[1] === "-" || m[1] === "−" ? "-" : ""}${m[2].replace(/[   ]/g, "")}.${m[3] || "0"}`)
    return Number.isFinite(n) ? n : text
  }

  async download(event, table, title) {
    event.preventDefault()
    const button = event.currentTarget
    const label = button.innerHTML
    button.innerHTML = "…"
    try {
      const XLSX = await import("xlsx")
      const rows = []
      table.querySelectorAll("tr").forEach((tr) => {
        const row = []
        tr.querySelectorAll("th,td").forEach((c) => {
          const header = c.tagName === "TH" || tr.closest("thead")
          row.push(header ? c.textContent.replace(/\s+/g, " ").trim() : this.cellValue(c))
          for (let i = 1; i < (c.colSpan || 1); i++) row.push(null)
        })
        if (row.some((v) => v !== null && v !== "")) rows.push(row)
      })
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(rows)
      const ncol = Math.max(...rows.map((r) => r.length))
      ws["!cols"] = Array.from({ length: ncol }, (_, i) => ({ wch: i === 0 ? 44 : 18 }))
      XLSX.utils.book_append_sheet(wb, ws, "Données")
      const notes = XLSX.utils.aoa_to_sheet([[title], [`Territoire : ${this.territoryValue}`],
        ["Tableau exporté tel qu'affiché dans le tableau de bord ; cellule vide : donnée non disponible ou secret statistique."]])
      notes["!cols"] = [{ wch: 120 }]
      XLSX.utils.book_append_sheet(wb, notes, "Notes")
      const name = `${this.territoryValue} - ${title}`.replace(/[\/\\:*?"<>|]/g, "-").replace(/\s+/g, " ").slice(0, 120)
      XLSX.writeFile(wb, `${name}.xlsx`)
    } catch (e) {
      console.error("Export Excel impossible", e)
      alert("Le téléchargement a échoué. Vérifiez votre connexion et réessayez.")
    } finally {
      button.innerHTML = label
    }
  }
}
