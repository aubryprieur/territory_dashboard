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
      row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin:0 0 1rem"
      first.parentNode.insertBefore(row, first)
      const buttons = run.map((d) => {
        const summary = d.querySelector(":scope > summary")
        const b = document.createElement("button")
        b.type = "button"
        b.textContent = summary ? summary.textContent.trim() : "Carte"
        if (summary) summary.style.display = "none"
        d.dataset.grouped = "1"
        d.style.margin = "0"
        row.appendChild(b)
        return b
      })
      const paint = () => run.forEach((d, i) => {
        const on = d.open
        buttons[i].style.cssText = `${BTN};background:${on ? "#4f46e5" : "#f8faff"};color:${on ? "#fff" : "#3730a3"}`
      })
      buttons.forEach((b, i) => b.addEventListener("click", () => {
        const open = !run[i].open
        run.forEach((d) => { d.open = false })
        run[i].open = open
        paint()
        window.dispatchEvent(new Event("resize"))
      }))
      paint()
      run[run.length - 1].style.marginBottom = "2rem"
    })
  }
}
