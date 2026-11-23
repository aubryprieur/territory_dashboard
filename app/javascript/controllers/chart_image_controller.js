import { Controller } from "@hotwired/stimulus"

// Bouton « Image » sous un graphique (chart_canvas) : enregistre le graphique en PNG sur fond blanc, avec en tête le
// titre du bloc et le territoire, et en pied la source (lien « Source » du bloc) — prêt à coller dans un rapport.
export default class extends Controller {
  static targets = ["canvas"]

  download() {
    const chart = this.canvasTarget
    if (!chart || !chart.width) return
    const ratio = chart.clientWidth > 0 ? chart.width / chart.clientWidth : (window.devicePixelRatio || 1)
    const pad = Math.round(24 * ratio)
    const width = chart.width + pad * 2
    const section = this.element.closest("section") || this.element.closest(".bg-white")
    const heading = section && section.querySelector("h3")
    const title = this.clean(heading ? heading.textContent : chart.getAttribute("aria-label"))
    const subtitle = this.clean(chart.getAttribute("aria-label")) !== title ? this.clean(chart.getAttribute("aria-label")) : ""
    const territory = this.territoryName()
    const srcNode = section && section.querySelector('[data-note="src"]')
    const source = srcNode ? `Source : ${this.clean(srcNode.textContent)}` : ""

    // Mesure des lignes de texte (retour à la ligne automatique)
    const tmp = document.createElement("canvas").getContext("2d")
    const font = (size, weight = 400) => `${weight} ${Math.round(size * ratio)}px Inter, system-ui, -apple-system, "Segoe UI", sans-serif`
    const wrap = (text, f, max) => {
      if (!text) return []
      tmp.font = f
      const lines = []
      let line = ""
      text.split(/\s+/).forEach((w) => {
        const test = line ? `${line} ${w}` : w
        if (tmp.measureText(test).width > max && line) { lines.push(line); line = w } else { line = test }
      })
      if (line) lines.push(line)
      return lines
    }
    const maxW = width - pad * 2
    const titleFont = font(17, 600), subFont = font(13), srcFont = font(11)
    const titleLines = wrap(title, titleFont, maxW)
    const subLines = wrap([territory, subtitle].filter(Boolean).join(" · "), subFont, maxW)
    const srcLines = wrap(source, srcFont, maxW)
    const lh = (size) => Math.round(size * 1.45 * ratio)
    const headH = titleLines.length * lh(17) + subLines.length * lh(13) + Math.round(12 * ratio)
    const footH = srcLines.length ? srcLines.length * lh(11) + Math.round(12 * ratio) : 0
    const height = pad + headH + chart.height + footH + pad

    const out = document.createElement("canvas")
    out.width = width
    out.height = height
    const ctx = out.getContext("2d")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)
    ctx.textBaseline = "top"
    let y = pad
    ctx.fillStyle = "#111827"; ctx.font = titleFont
    titleLines.forEach((l) => { ctx.fillText(l, pad, y); y += lh(17) })
    ctx.fillStyle = "#4b5563"; ctx.font = subFont
    subLines.forEach((l) => { ctx.fillText(l, pad, y); y += lh(13) })
    y += Math.round(12 * ratio)
    ctx.drawImage(chart, pad, y)
    y += chart.height + Math.round(12 * ratio)
    ctx.fillStyle = "#6b7280"; ctx.font = srcFont
    srcLines.forEach((l) => { ctx.fillText(l, pad, y); y += lh(11) })

    out.toBlob((blob) => {
      if (!blob) return
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${this.slug([title, territory].filter(Boolean).join(" "))}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    }, "image/png")
  }

  territoryName() {
    try {
      const info = document.getElementById("dashboard-info")
      return info ? JSON.parse(info.textContent).commune_name || "" : ""
    } catch (e) { return "" }
  }

  clean(text) { return (text || "").replace(/\s+/g, " ").trim() }

  slug(text) {
    return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "graphique"
  }
}
