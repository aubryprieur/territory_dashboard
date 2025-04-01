import * as Turbo from "@hotwired/turbo"
window.Turbo = Turbo

import "controllers"

// ✅ AlpineJS via CDN, pas de default export
import * as Alpine from "alpinejs"
window.Alpine = Alpine
Alpine.start()

// ✅ Chart.js UMD (pas de default)
import * as ChartModule from "chart.js"
import * as ChartDataLabels from "chartjs-plugin-datalabels"
window.Chart = ChartModule.Chart
window.ChartDataLabels = ChartDataLabels
