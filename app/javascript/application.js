import * as Turbo from "@hotwired/turbo"
window.Turbo = Turbo

import "controllers"

// ✅ Alpine.js - import correct
import * as Alpine from "alpinejs"
window.Alpine = Alpine
Alpine.start()

// ✅ Leaflet - import correct
import * as L from "leaflet"
window.L = L

// ✅ Chart.js - imports corrigés (pas de default export)
import * as ChartModule from "chart.js"
import * as ChartDataLabels from "chartjs-plugin-datalabels"
window.Chart = ChartModule.Chart
window.ChartDataLabels = ChartDataLabels
ChartModule.Chart.register(ChartDataLabels.default)

// ✅ Simple-Statistics - import correct
import * as ss from "simple-statistics"
window.ss = ss

// EPCI Maps
import "maps/epci_births_map"
import "maps/epci_children_maps"
import "maps/epci_economic_maps"
import "maps/epci_families_maps"
import "maps/epci_women_employment_maps"
import "maps/epci_schooling_maps"
import "maps/epci_childcare_map"
import "maps/epci_domestic_violence_map"

// EPCI Charts
import "charts/epci_births_history_chart"
import "charts/epci_age_pyramid_chart"
import "charts/epci_domestic_violence_chart"
import "charts/epci_population_history_chart"
import "charts/epci_family_employment_chart"
import "charts/epci_communes_chart"

// Cities Charts
import "charts/historique_chart"
import "charts/economic_charts"
import "charts/births_chart"
import "charts/domestic_violence_chart"
import "charts/family_employment_chart"
import "charts/age_pyramid_chart"
