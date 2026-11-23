import { Controller } from "@hotwired/stimulus"

// Recherche d'un territoire (page d'accueil du super administrateur) : interroge /epcis/autocomplete et
// /territories/autocomplete (réservés au super admin), affiche intercommunalités puis communes, et ouvre le tableau de
// bord choisi (/dashboard?epci_code=… ou ?commune_code=…). Clavier : flèches, Entrée, Échap.
export default class extends Controller {
  static targets = ["input", "results"]
  static values = { dashboardUrl: { type: String, default: "/dashboard" } }

  connect() {
    this.items = []
    this.active = -1
    this.timer = null
    this.closeOnOutside = (e) => { if (!this.element.contains(e.target)) this.hide() }
    document.addEventListener("click", this.closeOnOutside)
  }

  disconnect() {
    document.removeEventListener("click", this.closeOnOutside)
    clearTimeout(this.timer)
  }

  search() {
    clearTimeout(this.timer)
    const term = this.inputTarget.value.trim()
    if (term.length < 2) { this.hide(); return }
    this.timer = setTimeout(() => this.fetchResults(term), 250)
  }

  async fetchResults(term) {
    const q = encodeURIComponent(term)
    const get = (url) => fetch(url, { headers: { Accept: "application/json" }, credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : [])).catch(() => [])
    const [epcis, communes] = await Promise.all([get(`/epcis/autocomplete?term=${q}`), get(`/territories/autocomplete?term=${q}`)])
    if (term !== this.inputTarget.value.trim()) return // réponse d'une frappe précédente
    this.items = [
      ...epcis.slice(0, 6).map((e) => ({ kind: "epci", code: e.epci_code, name: e.name, detail: `${e.epci_code} · ${(e.label || "").split(" - ").pop()}` })),
      ...communes.slice(0, 10).map((c) => ({ kind: "commune", code: c.codgeo, name: c.value, detail: `${c.codgeo} · Dép. ${c.dep}` }))
    ]
    this.active = this.items.length ? 0 : -1
    this.render()
  }

  render() {
    const el = this.resultsTarget
    if (!this.items.length) {
      el.innerHTML = `<div class="px-4 py-3 text-sm text-gray-500">Aucun territoire trouvé.</div>`
      el.hidden = false
      return
    }
    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
    let html = ""
    let last = null
    this.items.forEach((it, i) => {
      if (it.kind !== last) {
        html += `<div class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">${it.kind === "epci" ? "Intercommunalités" : "Communes"}</div>`
        last = it.kind
      }
      html += `<button type="button" data-index="${i}" class="w-full text-left px-4 py-2 flex items-center justify-between gap-3 ${i === this.active ? "bg-indigo-50" : "hover:bg-gray-50"}">
        <span class="text-sm text-gray-900">${esc(it.name)}</span>
        <span class="text-xs text-gray-500 whitespace-nowrap">${esc(it.detail)}</span></button>`
    })
    el.innerHTML = html
    el.querySelectorAll("button[data-index]").forEach((b) => b.addEventListener("click", () => this.open(Number(b.dataset.index))))
    el.hidden = false
  }

  keydown(e) {
    if (this.resultsTarget.hidden || !this.items.length) return
    if (e.key === "ArrowDown") { e.preventDefault(); this.active = (this.active + 1) % this.items.length; this.render() }
    else if (e.key === "ArrowUp") { e.preventDefault(); this.active = (this.active - 1 + this.items.length) % this.items.length; this.render() }
    else if (e.key === "Enter") { e.preventDefault(); if (this.active >= 0) this.open(this.active) }
    else if (e.key === "Escape") { this.hide() }
  }

  open(i) {
    const it = this.items[i]
    if (!it) return
    const param = it.kind === "epci" ? "epci_code" : "commune_code"
    window.location.href = `${this.dashboardUrlValue}?${param}=${encodeURIComponent(it.code)}`
  }

  hide() {
    this.resultsTarget.hidden = true
  }
}
