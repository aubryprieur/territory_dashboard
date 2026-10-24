import { Controller } from "@hotwired/stimulus"

// Carte carroyée sur fond Plan IGN (Leaflet, chargé globalement dans application.js : window.L).
// Données : data-grid-map-data-value = { cells: [{ corners: [[lat, lon] x4], color, imputed, tip }], outline: [GeoJSON] }
export default class extends Controller {
  static targets = ["map"]
  static values = { data: Object }

  connect() {
    if (typeof window.L === "undefined" || this.map) return
    const L = window.L
    this.fillOpacity = 0.7
    this.map = L.map(this.mapTarget, { scrollWheelZoom: false, zoomSnap: 0.25, zoomDelta: 0.5 })
    L.tileLayer(
      "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2" +
      "&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
      { maxZoom: 18, attribution: "&copy; IGN — Plan IGN" }
    ).addTo(this.map)

    // contour : pointillés gris pour un carreau estimé par l'Insee, blanc fin sinon
    const border = (c) => ({
      color: c.imputed ? "#64748b" : "#ffffff",
      weight: c.imputed ? 1 : 1.2,
      dashArray: c.imputed ? "4 3" : null
    })
    this.cells = (this.dataValue.cells || []).map((c) => {
      const poly = L.polygon(c.corners, {
        ...border(c), fillColor: c.color, fillOpacity: c.imputed ? this.fillOpacity * 0.6 : this.fillOpacity
      }).bindTooltip(c.tip, { sticky: true })
      poly.on("mouseover", () => { poly.setStyle({ weight: 3.5, color: "#111827" }); poly.bringToFront() })
      poly.on("mouseout", () => poly.setStyle(border(c)))
      poly._imputed = c.imputed
      return poly.addTo(this.map)
    })

    if ((this.dataValue.outline || []).length) {
      L.geoJSON(this.dataValue.outline, {
        style: { color: "#1f2937", weight: 1.2, fill: false, opacity: 0.8 }, interactive: false
      }).addTo(this.map)
    }

    const group = L.featureGroup(this.cells)
    this.fit = () => this.map.fitBounds(group.getBounds(), { padding: [4, 4] })
    if (this.cells.length) this.fit()
    this.map.on("click", () => this.map.scrollWheelZoom.enable())
    this.map.on("mouseout", () => this.map.scrollWheelZoom.disable())
    // la carte peut être construite dans un onglet encore masqué : recalcul de la taille à l'affichage
    this.resizeObserver = new ResizeObserver(() => {
      this.map.invalidateSize()
      if (this.cells.length && !this.fitted && this.mapTarget.offsetWidth > 0) {
        this.fit()
        this.fitted = true
      }
    })
    this.resizeObserver.observe(this.mapTarget)
  }

  opacity(event) {
    this.fillOpacity = parseFloat(event.target.value)
    this.cells.forEach((p) => p.setStyle({ fillOpacity: p._imputed ? this.fillOpacity * 0.6 : this.fillOpacity }))
  }

  disconnect() {
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.map) { this.map.remove(); this.map = null }
  }
}
