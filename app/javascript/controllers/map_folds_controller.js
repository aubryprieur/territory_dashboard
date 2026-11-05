import { Controller } from "@hotwired/stimulus"

// Cartes repliées (<details class="map-fold"> des partials _iris_map / _grid_map) : quand plusieurs se suivent,
// leurs boutons sont regroupés sur une même ligne (comme les bascules Graphique / Tableau). Un clic ouvre la carte
// sous la ligne de boutons et referme les autres ; un second clic la referme.
// Les onglets étant injectés à la volée, un MutationObserver relance le regroupement.
const BTN = "display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid #c7d2fe;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500"

export default class extends Controller {
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
    this.element.querySelectorAll("details.map-fold:not([data-grouped])").forEach((first) => {
      if (first.dataset.grouped) return
      const run = [first]
      let next = first.nextElementSibling
      while (next && next.matches("details.map-fold") && !next.dataset.grouped) {
        run.push(next)
        next = next.nextElementSibling
      }
      if (run.length < 2) {
        first.dataset.grouped = "single"
        return
      }
      const row = document.createElement("div")
      row.style.cssText = "display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:0 0 1rem"
      first.parentNode.insertBefore(row, first)
      // Libellés « 🗺 Voir la carte par quartier (IRIS) : part des … » : préfixe commun affiché une fois
      const parts = run.map((d) => {
        const summary = d.querySelector(":scope > summary")
        const text = summary ? summary.textContent.trim() : "Carte"
        if (summary) summary.style.display = "none"
        d.dataset.grouped = "1"
        d.style.margin = "0"
        const k = text.indexOf(" : ")
        return k > 0 ? [text.slice(0, k), text.slice(k + 3)] : ["", text]
      })
      const samePrefix = parts.every(([p]) => p && p === parts[0][0])
      if (samePrefix) {
        const lead = document.createElement("span")
        lead.textContent = `${parts[0][0]} :`
        lead.style.cssText = "font-size:13px;font-weight:500;color:#3730a3"
        row.appendChild(lead)
      }
      const group = document.createElement("div")
      group.style.cssText = "display:inline-flex;flex-wrap:wrap;border-radius:8px;overflow:hidden"
      row.appendChild(group)
      const buttons = parts.map(([prefix, rest], i) => {
        const b = document.createElement("button")
        b.type = "button"
        const kind = /carreau/.test(prefix) ? "par carreau" : "par quartier"
        b.textContent = samePrefix ? rest : `${kind} : ${rest}`
        b.dataset.pos = i === 0 ? "first" : (i === parts.length - 1 ? "last" : "mid")
        group.appendChild(b)
        return b
      })
      const radius = (b) => (b.dataset.pos === "first" ? "8px 0 0 8px" : (b.dataset.pos === "last" ? "0 8px 8px 0" : "0"))
      const paint = () => run.forEach((d, i) => {
        const on = d.open
        buttons[i].style.cssText = `${BTN};border-radius:${radius(buttons[i])};${i ? "border-left:none;" : ""}background:${on ? "#4f46e5" : "#f8faff"};color:${on ? "#fff" : "#3730a3"}`
      })
      buttons.forEach((b, i) => b.addEventListener("click", () => {
        const open = !run[i].open
        run.forEach((d) => { d.open = false })
        run[i].open = open
        paint()
        window.dispatchEvent(new Event("resize"))
      }))
      paint()
        window.dispatchEvent(new Event("resize"))
      }))
      paint()
      run[run.length - 1].style.marginBottom = "2rem"
    })
  }
}
