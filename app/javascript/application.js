import * as Turbo from "@hotwired/turbo"
window.Turbo = Turbo

import "controllers"

// ✅ AlpineJS via CDN, pas de default export
import * as Alpine from "alpinejs"
window.Alpine = Alpine
Alpine.start()

// Ajouter l'import pour Leaflet
import * as L from "leaflet"
window.L = L

// ✅ Chart.js UMD (pas de default)
import * as ChartModule from "chart.js"
import * as ChartDataLabels from "chartjs-plugin-datalabels"
window.Chart = ChartModule.Chart
window.ChartDataLabels = ChartDataLabels
Chart.register(ChartDataLabels)

// Commune Dashboard
import "charts/historique_chart"
import "charts/economic_charts"
import "charts/births_chart"
import "charts/domestic_violence_chart"
import "charts/family_employment_chart"
import "charts/age_pyramid_chart"

// EPCI Dashboard
import "charts/epci_communes_chart"
