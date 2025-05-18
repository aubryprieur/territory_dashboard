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

// Importer Simple-Statistics
import * as SimpleStatistics from "simple-statistics"
window.ss = SimpleStatistics

// Commune Dashboard
import "charts/historique_chart"
import "charts/economic_charts"
import "charts/births_chart"
import "charts/domestic_violence_chart"
import "charts/family_employment_chart"
import "charts/age_pyramid_chart"

// EPCI Dashboard
// Charts
import "charts/epci_communes_chart"
import "charts/epci_age_pyramid_chart"
import "charts/epci_population_history_chart"
import "charts/epci_family_employment_chart"
import "charts/epci_births_history_chart"
import "charts/epci_domestic_violence_chart"
// Maps
import "maps/epci_domestic_violence_map"
import "maps/epci_childcare_map"
import "maps/epci_births_map"
import "maps/epci_children_maps"
import "maps/epci_economic_maps"
import "maps/epci_families_maps"
import "maps/epci_schooling_maps"
import "maps/epci_women_employment_maps"
