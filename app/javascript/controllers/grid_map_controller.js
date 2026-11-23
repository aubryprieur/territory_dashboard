import { Controller } from "@hotwired/stimulus"

// Carte choroplèthe sur fond Plan IGN (Leaflet, chargé globalement dans application.js : window.L).
// Sert aux cartes carroyées (_grid_map) et aux cartes IRIS (_iris_map).
// Données : data-grid-map-data-value = {
//   cells:  [{ corners: [[lat, lon] x4], color, imputed, tip }]   (carreaux)
//   shapes: [{ geometry: GeoJSON, color, tip }]                     (IRIS)
//   outline: [GeoJSON]                                              (contours de repérage, optionnel)
//   outline_fill: 0.4                                               (voile blanc sur les contours, optionnel)
//   zones: [{ geometry: GeoJSON, tip }]                             (IRIS ou communes de l'EPCI sous les points, voile blanc, optionnel)
//   points: [{ lat, lon, color, tip, faded }]                       (équipements localisés ; faded : hors territoire)
// }
// La carte n'est construite qu'à son arrivée à l'écran (IntersectionObserver) : un onglet riche en cartes ne
// télécharge que les fonds de carte réellement regardés.
export default class extends Controller {
  static targets = ["map"]
  static values = { data: Object, opacity: { type: Number, default: 0.7 } }

  connect() {
    if (typeof window.L === "undefined") return
    this.observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        this.observer.disconnect()
        this.build()
      }
    }, { rootMargin: "200px" })
    this.observer.observe(this.mapTarget)
  }

  build() {
    if (this.map) return
    const L = window.L
    this.fillOpacity = this.opacityValue
    this.map = L.map(this.mapTarget, { scrollWheelZoom: false, zoomSnap: 0.25, zoomDelta: 0.5 })
    this.tileLayer = L.tileLayer(
      "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2" +
      "&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
      { maxZoom: 18, attribution: "&copy; IGN — Plan IGN" }
    ).addTo(this.map)

    // contour : pointillés gris pour un carreau estimé par l'Insee, blanc fin sinon
    const border = (c) => ({ color: c.imputed ? "#64748b" : "#ffffff", weight: c.imputed ? 1 : 1.2,
                             dashArray: c.imputed ? "4 3" : null })
    const hover = (layer, c) => {
      layer.on("mouseover", () => { layer.setStyle({ weight: 3, color: "#111827" }); layer.bringToFront() })
      layer.on("mouseout", () => layer.setStyle(border(c)))
    }
    this.layers = []
    ;(this.dataValue.cells || []).forEach((c) => {
      const poly = L.polygon(c.corners, {
        ...border(c), fillColor: c.color, fillOpacity: c.imputed ? this.fillOpacity * 0.6 : this.fillOpacity
      }).bindTooltip(c.tip, { sticky: true })
      hover(poly, c)
      poly._imputed = c.imputed
      this.layers.push(poly.addTo(this.map))
    })
    ;(this.dataValue.shapes || []).forEach((s) => {
      const layer = L.geoJSON(s.geometry, {
        style: { ...border(s), fillColor: s.color, fillOpacity: this.fillOpacity }
      }).bindTooltip(s.tip, { sticky: true })
      hover(layer, s)
      this.layers.push(layer.addTo(this.map))
    })

    // Contour et points : créés d'abord, ajoutés à la carte une fois la vue fixée (ajouter des tracés avant la
    // première vue fait échouer le rendu SVG de Leaflet : « Cannot read properties of undefined (reading 'min') »)
    const outlineLayer = (this.dataValue.outline || []).length
      ? L.geoJSON(this.dataValue.outline, {
          // outline_fill : voile blanc léger sur le territoire (cartes de points : les points ressortent mieux)
          style: this.dataValue.outline_fill
            ? { color: "#1f2937", weight: 1.2, opacity: 0.8, fill: true, fillColor: "#ffffff", fillOpacity: this.dataValue.outline_fill }
            : { color: "#1f2937", weight: 1.2, fill: false, opacity: 0.8 },
          interactive: false
        })
      : null
    // Points (équipements) : cercles colorés par catégorie, atténués hors du territoire
    this.points = (this.dataValue.points || []).map((p) => {
      const m = L.circleMarker([p.lat, p.lon], {
        radius: p.faded ? 4 : 6, color: "#ffffff", weight: 1, fillColor: p.color, fillOpacity: p.faded ? 0.45 : 0.95
      }).bindTooltip(p.tip)
      m._category = p.category
      return m
    })

    const group = this.layers.length ? L.featureGroup(this.layers)
      : (outlineLayer || (this.points.length ? L.featureGroup(this.points) : null))
    this.fit = (opts = {}) => { if (group) this.map.fitBounds(group.getBounds(), { padding: [4, 4], ...opts }) }
    this.fit()
    if (!group) this.map.setView([46.6, 2.5], 6)
    // Quartiers IRIS (cartes de points d'une commune) : contour fin, voile blanc, nom au survol
    this.zoneLayers = []
    ;(this.dataValue.zones || []).forEach((z) => {
      this.zoneLayers.push(L.geoJSON(z.geometry, {
        style: { color: "#64748b", weight: 0.8, opacity: 0.9, fill: true, fillColor: "#ffffff",
                 fillOpacity: this.dataValue.outline_fill || 0.4 }
      }).bindTooltip(z.tip, { sticky: true }).addTo(this.map))
    })
    this.outlineLayer = outlineLayer
    if (outlineLayer) outlineLayer.addTo(this.map)
    this.points.forEach((m) => m.addTo(this.map))
    this.map.on("click", () => this.map.scrollWheelZoom.enable())
    this.map.on("mouseout", () => this.map.scrollWheelZoom.disable())
    // carte construite dans un onglet encore masqué : recalcul de la taille à l'affichage
    this.resizeObserver = new ResizeObserver(() => {
      this.map.invalidateSize()
      if (!this.fitted && this.mapTarget.offsetWidth > 0) { this.fit(); this.fitted = true }
    })
    this.resizeObserver.observe(this.mapTarget)
  }

  // Filtre des points par catégorie (cases à cocher de la légende : data-category)
  toggleCategory(event) {
    const cat = event.target.dataset.category
    const on = event.target.checked
    ;(this.points || []).forEach((m) => {
      if (m._category !== cat) return
      if (on) m.addTo(this.map); else m.remove()
    })
  }

  opacity(event) {
    this.fillOpacity = parseFloat(event.target.value)
    ;(this.layers || []).forEach((p) => p.setStyle({ fillOpacity: p._imputed ? this.fillOpacity * 0.6 : this.fillOpacity }))
  }

  // « ⤓ Image » : PNG de la carte telle qu'affichée (fond IGN si ses tuiles acceptent l'export, tracés, points),
  // avec titre du bloc, territoire, légende (éléments [data-legend-color][data-legend-label] ; cases décochées
  // exclues), note de couleur ([data-legend-note]) et source (lien « Source » du bloc)
  async exportImage() {
    if (!this.map) return
    const L = window.L
    const map = this.map
    // Cadrage de l'image : la vue d'ensemble centrée sur le territoire, puis retour à la vue de l'utilisateur.
    // Le fond et les tracés sont redessinés à partir des coordonnées de Leaflet (pas des positions à l'écran).
    const view = { center: map.getCenter(), zoom: map.getZoom() }
    map.invalidateSize()
    if (this.fit) this.fit({ animate: false })
    const size = map.getSize()
    const box = { width: size.x, height: size.y }
    if (!box.width || !box.height) { map.setView(view.center, view.zoom, { animate: false }); return }
    const cp = (ll) => map.latLngToContainerPoint(ll)

    // Tuiles du fond à dessiner : niveau entier de Leaflet, mises à l'échelle du zoom fractionnaire
    const tiles = []
    if (this.tileLayer) {
      const z = this.tileLayer._tileZoom ?? Math.round(map.getZoom())
      const ts = 256
      const nw = map.project(map.containerPointToLatLng([0, 0]), z).divideBy(ts).floor()
      const se = map.project(map.containerPointToLatLng([size.x, size.y]), z).divideBy(ts).floor()
      for (let x = nw.x; x <= se.x; x++) {
        for (let y = nw.y; y <= se.y; y++) {
          const p1 = cp(map.unproject(L.point(x * ts, y * ts), z))
          const p2 = cp(map.unproject(L.point((x + 1) * ts, (y + 1) * ts), z))
          const url = this.tileLayer._url.replace("{z}", z).replace("{x}", x).replace("{y}", y)
          tiles.push({ url, x: p1.x, y: p1.y, w: p2.x - p1.x, h: p2.y - p1.y })
        }
      }
    }
    // Tracés : anneaux en coordonnées écran et style de chaque couche, relevés dans ce cadrage
    const shapes = []
    const ringsOf = (lls, out = []) => {
      if (!lls || !lls.length) return out
      if (lls[0] instanceof L.LatLng) out.push(lls.map((ll) => cp(ll)))
      else lls.forEach((sub) => ringsOf(sub, out))
      return out
    }
    const collect = (layer) => {
      if (!layer || !map.hasLayer(layer)) return
      if (layer instanceof L.CircleMarker) {
        shapes.push({ circle: cp(layer.getLatLng()), r: layer.getRadius(), o: layer.options })
      } else if (layer.getLatLngs) {
        shapes.push({ rings: ringsOf(layer.getLatLngs()), o: layer.options })
      } else if (layer.eachLayer) {
        layer.eachLayer(collect)
      }
    }
    ;(this.zoneLayers || []).forEach(collect)
    ;(this.layers || []).forEach(collect)
    collect(this.outlineLayer)
    ;(this.points || []).forEach(collect)
    map.setView(view.center, view.zoom, { animate: false })

    const ratio = Math.max(window.devicePixelRatio || 1, 2)
    const mapCanvas = document.createElement("canvas")
    mapCanvas.width = Math.round(box.width * ratio)
    mapCanvas.height = Math.round(box.height * ratio)
    const mctx = mapCanvas.getContext("2d")
    mctx.scale(ratio, ratio)
    mctx.fillStyle = "#f8fafc"
    mctx.fillRect(0, 0, box.width, box.height)
    const load = (src) => new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })
    let basemap = tiles.length > 0
    const imgs = await Promise.all(tiles.map((t) => load(t.url)))
    imgs.forEach((img, k) => {
      if (!img) { basemap = false; return }
      const t = tiles[k]
      mctx.drawImage(img, t.x, t.y, t.w + 0.5, t.h + 0.5)
    })
    shapes.forEach(({ rings, circle, r, o }) => {
      mctx.beginPath()
      if (circle) mctx.arc(circle.x, circle.y, r, 0, Math.PI * 2)
      else rings.forEach((ring) => ring.forEach((p, i) => (i ? mctx.lineTo(p.x, p.y) : mctx.moveTo(p.x, p.y))) || mctx.closePath())
      if (o.fill !== false && (o.fillColor || circle)) {
        mctx.globalAlpha = o.fillOpacity ?? 0.2
        mctx.fillStyle = o.fillColor || o.color || "#3388ff"
        mctx.fill("evenodd")
      }
      if (o.stroke !== false && (o.weight ?? 3) > 0) {
        mctx.globalAlpha = o.opacity ?? 1
        mctx.strokeStyle = o.color || "#3388ff"
        mctx.lineWidth = o.weight ?? 3
        mctx.lineJoin = "round"
        mctx.setLineDash(o.dashArray ? String(o.dashArray).split(/[ ,]+/).map(Number) : [])
        mctx.stroke()
        mctx.setLineDash([])
      }
      mctx.globalAlpha = 1
    })

    // Attribution du fond de carte en bas à droite
    mctx.font = "10px Inter, system-ui, sans-serif"
    const attr = basemap ? "© IGN — Plan IGN" : ""
    if (attr) {
      const w = mctx.measureText(attr).width + 8
      mctx.fillStyle = "rgba(255,255,255,0.8)"; mctx.fillRect(box.width - w, box.height - 16, w, 16)
      mctx.fillStyle = "#374151"; mctx.fillText(attr, box.width - w + 4, box.height - 5)
    }

    // Composition : titre, territoire, carte, légende, note, source
    const scope = this.element.closest("section") || this.element
    const clean = (t) => (t || "").replace(/\s+/g, " ").trim()
    const heading = scope.querySelector("h3")
    const title = clean(heading && heading.textContent) || "Carte"
    let territory = ""
    try { territory = JSON.parse(document.getElementById("dashboard-info").textContent).commune_name || "" } catch (e) {}
    const legend = [...this.element.querySelectorAll("[data-legend-color][data-legend-label]")].filter((n) => {
      const cb = n.querySelector("input[type=checkbox]")
      return !cb || cb.checked
    }).map((n) => ({ color: n.dataset.legendColor, label: clean(n.dataset.legendLabel) }))
    const noteNode = scope.querySelector("[data-legend-note]")
    const note = noteNode ? clean(noteNode.textContent) : ""
    const srcNode = scope.querySelector('[data-note="src"]')
    const source = srcNode ? `Source : ${clean(srcNode.textContent)}` : ""

    const pad = 24, W = Math.round(box.width) + pad * 2
    const tmp = document.createElement("canvas").getContext("2d")
    const font = (size, weight = 400) => `${weight} ${size}px Inter, system-ui, -apple-system, "Segoe UI", sans-serif`
    const wrap = (text, f, max) => {
      if (!text) return []
      tmp.font = f
      const lines = []; let line = ""
      text.split(/\s+/).forEach((w) => {
        const test = line ? `${line} ${w}` : w
        if (tmp.measureText(test).width > max && line) { lines.push(line); line = w } else { line = test }
      })
      if (line) lines.push(line)
      return lines
    }
    const maxW = W - pad * 2
    const titleL = wrap(title, font(17, 600), maxW), terrL = wrap(territory, font(13), maxW)
    const noteL = wrap(note, font(11), maxW), srcL = wrap(source, font(11), maxW)
    // légende : pastilles en lignes
    tmp.font = font(12)
    const items = legend.map((it) => ({ ...it, w: 18 + tmp.measureText(it.label).width + 16 }))
    const rows = []; let row = [], rw = 0
    items.forEach((it) => { if (rw + it.w > maxW && row.length) { rows.push(row); row = []; rw = 0 } row.push(it); rw += it.w })
    if (row.length) rows.push(row)
    const headH = titleL.length * 25 + terrL.length * 19 + 12
    const legH = rows.length ? rows.length * 20 + 10 : 0
    const footH = (noteL.length + srcL.length) * 16 + (noteL.length || srcL.length ? 8 : 0)
    const H = pad + headH + box.height + 12 + legH + footH + pad

    const out = document.createElement("canvas")
    out.width = Math.round(W * ratio); out.height = Math.round(H * ratio)
    const ctx = out.getContext("2d")
    ctx.scale(ratio, ratio)
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H)
    ctx.textBaseline = "top"
    let y = pad
    ctx.fillStyle = "#111827"; ctx.font = font(17, 600); titleL.forEach((l) => { ctx.fillText(l, pad, y); y += 25 })
    ctx.fillStyle = "#4b5563"; ctx.font = font(13); terrL.forEach((l) => { ctx.fillText(l, pad, y); y += 19 })
    y += 12
    ctx.drawImage(mapCanvas, pad, y, box.width, box.height)
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1; ctx.strokeRect(pad + 0.5, y + 0.5, box.width - 1, box.height - 1)
    y += box.height + 12
    ctx.font = font(12)
    rows.forEach((r) => {
      let x = pad
      r.forEach((it) => {
        ctx.fillStyle = it.color; ctx.fillRect(x, y + 2, 12, 12)
        ctx.fillStyle = "#374151"; ctx.fillText(it.label, x + 18, y + 1)
        x += it.w
      })
      y += 20
    })
    if (rows.length) y += 10
    ctx.font = font(11)
    ctx.fillStyle = "#4b5563"; noteL.forEach((l) => { ctx.fillText(l, pad, y); y += 16 })
    ctx.fillStyle = "#6b7280"; srcL.forEach((l) => { ctx.fillText(l, pad, y); y += 16 })

    const slug = [title, territory].filter(Boolean).join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "carte"
    try {
      out.toBlob((blob) => {
        if (!blob) return
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob); a.download = `${slug}.png`
        document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      }, "image/png")
    } catch (e) {
      console.warn("Export de la carte impossible", e)
    }
  }

  disconnect() {
    if (this.observer) this.observer.disconnect()
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.map) { this.map.remove(); this.map = null }
  }
}
