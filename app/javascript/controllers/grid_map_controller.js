import { Controller } from "@hotwired/stimulus"

// Carte choroplèthe sur fond Plan IGN (Leaflet, chargé globalement dans application.js : window.L).
// Sert aux cartes carroyées (_grid_map) et aux cartes IRIS (_iris_map).
// Données : data-grid-map-data-value = {
//   cells:  [{ corners: [[lat, lon] x4], color, imputed, tip }]   (carreaux)
//   shapes: [{ geometry: GeoJSON, color, tip }]                     (IRIS)
//   outline: [GeoJSON]                                              (contours de repérage, optionnel)
//   outline_fill: 0.4                                               (voile blanc sur les contours, optionnel)
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
    L.tileLayer(
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
    this.fit = () => { if (group) this.map.fitBounds(group.getBounds(), { padding: [4, 4] }) }
    this.fit()
    if (!group) this.map.setView([46.6, 2.5], 6)
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

  disconnect() {
    if (this.observer) this.observer.disconnect()
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.map) { this.map.remove(); this.map = null }
  }
}
