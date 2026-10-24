import { Controller } from "@hotwired/stimulus"

// Carte choroplèthe sur fond Plan IGN (Leaflet, chargé globalement dans application.js : window.L).
// Sert aux cartes carroyées (_grid_map) et aux cartes IRIS (_iris_map).
// Données : data-grid-map-data-value = {
//   cells:  [{ corners: [[lat, lon] x4], color, imputed, tip }]   (carreaux)
//   shapes: [{ geometry: GeoJSON, color, tip }]                     (IRIS)
//   outline: [GeoJSON]                                              (contours de repérage, optionnel)
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

    if ((this.dataValue.outline || []).length) {
      L.geoJSON(this.dataValue.outline, {
        style: { color: "#1f2937", weight: 1.2, fill: false, opacity: 0.8 }, interactive: false
      }).addTo(this.map)
    }

    const group = L.featureGroup(this.layers)
    this.fit = () => { if (this.layers.length) this.map.fitBounds(group.getBounds(), { padding: [4, 4] }) }
    this.fit()
    this.map.on("click", () => this.map.scrollWheelZoom.enable())
    this.map.on("mouseout", () => this.map.scrollWheelZoom.disable())
    // carte construite dans un onglet encore masqué : recalcul de la taille à l'affichage
    this.resizeObserver = new ResizeObserver(() => {
      this.map.invalidateSize()
      if (!this.fitted && this.mapTarget.offsetWidth > 0) { this.fit(); this.fitted = true }
    })
    this.resizeObserver.observe(this.mapTarget)
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
