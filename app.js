// --- Updated app.js with bug fixes for navigation, dropdown, and tooltip visibility ---

/************************************
 * DATA SECTION (unchanged)
 ***********************************/
const airlineData = {
    airlines: ["IndiGo", "Air India", "SpiceJet", "Akasa Air"],
    years: ["FY2020", "FY2021", "FY2022", "FY2023", "FY2024", "FY2025", "FY2026", "FY2027", "FY2028", "FY2029", "FY2030"],
    data: {
        "IndiGo": {
            revenue: [35000, 22000, 35000, 55000, 73000, 84098, 95000, 107000, 120000, 134000, 149000],
            profit: [-2840, -5800, -1681, 5090, 8172, 7253, 8500, 10200, 12000, 13800, 15600],
            color: "#1F2A55"
        },
        "Air India": {
            revenue: [28000, 15000, 22000, 38800, 65000, 78636, 88000, 105000, 125000, 148000, 175000],
            profit: [-8556, -7000, -6000, -4440, -8000, -10859, -5000, -1000, 3000, 7500, 12000],
            color: "#E76F51"
        },
        "SpiceJet": {
            revenue: [10000, 4500, 6500, 7500, 8497, 6736, 8500, 10500, 13000, 16000, 19500],
            profit: [-1000, -1800, -1500, -800, -404, 48, 300, 650, 1000, 1400, 1800],
            color: "#F9B550"
        },
        "Akasa Air": {
            revenue: [0, 0, 0, 778, 3144, 4684, 7000, 10500, 15500, 22000, 31000],
            profit: [0, 0, 0, -744, -1670, -1983, -500, 200, 1200, 2500, 4200],
            color: "#7C3AED"
        }
    },
    historical_years: ["FY2020", "FY2021", "FY2022", "FY2023", "FY2024", "FY2025"],
    projected_years: ["FY2026", "FY2027", "FY2028", "FY2029", "FY2030"],
};

/************************************
 * GLOBAL STATE
 ***********************************/
const charts = {};

/************************************
 * INITIALISATION
 ***********************************/
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initControls();
    initCustomDropdown();
    initCharts();
    updateMetrics();
});

/************************************
 * TAB NAVIGATION
 ***********************************/
function initNavigation() {
    const navContainer = document.querySelector('.nav-tabs');
    navContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.nav-tab');
        if (!button) return;

        const targetKey = button.dataset.tab;
        const targetPaneId = `${targetKey}-tab`;
        const targetPane = document.getElementById(targetPaneId);
        if (!targetPane) return;

        // Highlight the active tab button
        navContainer.querySelectorAll('.nav-tab').forEach(tab => tab.classList.toggle('active', tab === button));

        // Toggle pane visibility
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.toggle('active', pane === targetPane));

        // Update the relevant charts for the visible pane
        setTimeout(() => updateChartsForTab(targetKey), 100);
    });
}

/************************************
 * CUSTOM DROPDOWN (AIRLINE SELECT)
 ***********************************/
function initCustomDropdown() {
    const trigger = document.getElementById('airline-trigger');
    const options = document.getElementById('airline-options');

    // Helper to update label text
    function setTriggerText() {
        const checked = options.querySelectorAll('input[type="checkbox"]:checked');
        const total = options.querySelectorAll('input[type="checkbox"]').length;
        const span = trigger.querySelector('span');
        if (checked.length === 0) span.textContent = 'No Airlines Selected';
        else if (checked.length === total) span.textContent = 'All Airlines Selected';
        else if (checked.length === 1) span.textContent = checked[0].value;
        else span.textContent = `${checked.length} Airlines Selected`;
    }

    // Initial text
    setTriggerText();

    // Toggle list visibility
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        trigger.classList.toggle('active');
        options.classList.toggle('show');
    });

    // Checkbox change
    options.addEventListener('change', (e) => {
        if (e.target.matches('input[type="checkbox"]')) {
            setTriggerText();
            updateCharts();
        }
    });

    // Prevent closing when clicking inside the options panel
    options.addEventListener('click', (e) => e.stopPropagation());

    // Close dropdown when clicking elsewhere
    document.addEventListener('click', () => {
        trigger.classList.remove('active');
        options.classList.remove('show');
    });
}

/************************************
 * OTHER CONTROLS (YEAR RANGE & EXPORT)
 ***********************************/
function initControls() {
    // Year range select
    document.getElementById('year-range').addEventListener('change', updateCharts);

    // Chart type toggles (event delegation)
    document.addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.chart-toggle');
        if (!toggleBtn) return;
        const container = toggleBtn.closest('.chart-container');
        container.querySelectorAll('.chart-toggle').forEach(btn => btn.classList.toggle('active', btn === toggleBtn));
        updateRevenueChart(toggleBtn.dataset.chart);
    });

    // Export button
    document.getElementById('export-btn').addEventListener('click', exportCharts);
}

/************************************
 * CHART CREATION HELPERS
 ***********************************/
function tooltipConfig(isProfit = false) {
    return {
        enabled: true,
        intersect: false,
        mode: 'index',
        backgroundColor: 'rgba(255,255,255,0.98)',
        titleColor: '#1F2A55',
        borderColor: '#1F2A55',
        borderWidth: 1,
        padding: 12,
        callbacks: {
            title: (ctx) => `Year: ${ctx[0].label}`,
            label: (ctx) => {
                const val = ctx.parsed.y;
                const airline = ctx.dataset.label;
                if (airline === 'Akasa Air' && val === 0) return `${airline}: Not operational`;
                const prefix = isProfit && val >= 0 ? '+' : '';
                return `${airline}: ${prefix}₹${Math.abs(val).toLocaleString()} Cr`;
            },
            afterLabel: (ctx) => {
                const yr = ctx.label;
                const hist = airlineData.historical_years.includes(yr);
                return hist ? '(Historical Data)' : '(Projected Data)';
            }
        }
    };
}

function commonChartOptions(yAxisLabel, isProfit = false) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                labels: { usePointStyle: true, color: '#1F2A55', padding: 18 }
            },
            tooltip: tooltipConfig(isProfit)
        },
        scales: {
            x: {
                title: { display: true, text: 'Financial Year', color: '#1F2A55', font: { weight: 600 } },
                ticks: { color: '#1F2A55' },
                grid: { color: 'rgba(31,42,85,0.1)', drawBorder: false }
            },
            y: {
                title: { display: true, text: yAxisLabel, color: '#1F2A55', font: { weight: 600 } },
                ticks: {
                    color: '#1F2A55',
                    callback: (v) => {
                        const prefix = isProfit && v >= 0 ? '+' : '';
                        return `${prefix}₹${Math.abs(v).toLocaleString()}`;
                    }
                },
                grid: { color: 'rgba(31,42,85,0.1)', drawBorder: false }
            }
        }
    };
}

/************************************
 * CHART BUILDERS
 ***********************************/
function initCharts() {
    buildOverviewRevenue();
    buildOverviewProfit();
    buildDynamicRevenue();
    buildDynamicProfit();
    buildProjectedRevenue();
    buildProjectedProfit();
    buildMarketShare();
}

// Helpers to build datasets with dashed lines from FY2026 onwards
function dashedLineDataset(airline, values) {
    return {
        label: airline,
        data: values,
        borderColor: airlineData.data[airline].color,
        backgroundColor: airlineData.data[airline].color + '20',
        borderWidth: 3,
        tension: 0.4,
        fill: false,
        pointBackgroundColor: airlineData.data[airline].color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        segment: {
            borderDash: (ctx) => ctx.p0DataIndex >= 6 ? [8, 4] : undefined // FY2026 index 6
        }
    };
}

function buildOverviewRevenue() {
    const ctx = document.getElementById('overview-revenue-chart').getContext('2d');
    const datasets = airlineData.airlines.map(a => dashedLineDataset(a, airlineData.data[a].revenue));
    charts.overviewRevenue = new Chart(ctx, {
        type: 'line',
        data: { labels: airlineData.years, datasets },
        options: commonChartOptions('Revenue (₹ Cr)')
    });
}

function buildOverviewProfit() {
    const ctx = document.getElementById('overview-profit-chart').getContext('2d');
    const datasets = airlineData.airlines.map(a => {
        const base = dashedLineDataset(a, airlineData.data[a].profit);
        base.pointBackgroundColor = airlineData.data[a].profit.map(v => v >= 0 ? '#16a34a' : '#dc2626');
        return base;
    });
    charts.overviewProfit = new Chart(ctx, {
        type: 'line',
        data: { labels: airlineData.years, datasets },
        options: commonChartOptions('Profit / Loss (₹ Cr)', true)
    });
}

function buildDynamicRevenue(type = 'line') {
    const canvas = document.getElementById('revenue-chart');
    if (!canvas) return;
    if (charts.revenue) charts.revenue.destroy();

    const selAirlines = getSelectedAirlines();
    const { years, indices } = getFilteredYears();
    if (selAirlines.length === 0) return;

    const datasets = selAirlines.map(a => {
        const data = indices.map(i => airlineData.data[a].revenue[i]);
        return {
            label: a,
            data,
            backgroundColor: type === 'bar' ? airlineData.data[a].color + '80' : airlineData.data[a].color + '20',
            borderColor: airlineData.data[a].color,
            borderWidth: 3,
            fill: type === 'line' ? false : true,
            tension: 0.4,
            pointRadius: type === 'line' ? 5 : 0,
            pointHoverRadius: type === 'line' ? 8 : 0,
        };
    });

    charts.revenue = new Chart(canvas, {
        type,
        data: { labels: years, datasets },
        options: commonChartOptions('Revenue (₹ Cr)')
    });
}

function buildDynamicProfit() {
    const canvas = document.getElementById('profit-chart');
    if (!canvas) return;
    if (charts.profit) charts.profit.destroy();

    const selAirlines = getSelectedAirlines();
    const { years, indices } = getFilteredYears();
    if (selAirlines.length === 0) return;

    const datasets = selAirlines.map(a => {
        const data = indices.map(i => airlineData.data[a].profit[i]);
        return {
            label: a,
            data,
            backgroundColor: airlineData.data[a].color + '20',
            borderColor: airlineData.data[a].color,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: data.map(v => v >= 0 ? '#16a34a' : '#dc2626'),
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 9,
        };
    });

    charts.profit = new Chart(canvas, {
        type: 'line',
        data: { labels: years, datasets },
        options: commonChartOptions('Profit / Loss (₹ Cr)', true)
    });
}

function buildProjectedRevenue() {
    const canvas = document.getElementById('projected-revenue-chart');
    if (!canvas) return;
    const datasets = airlineData.airlines.map(a => {
        const data = airlineData.projected_years.map(y => {
            const idx = airlineData.years.indexOf(y);
            return airlineData.data[a].revenue[idx];
        });
        return {
            label: a,
            data,
            borderColor: airlineData.data[a].color,
            backgroundColor: airlineData.data[a].color + '30',
            borderWidth: 3,
            borderDash: [8, 4],
            fill: true,
            tension: 0.4,
            pointBackgroundColor: airlineData.data[a].color,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
        };
    });
    charts.projRevenue = new Chart(canvas, {
        type: 'line',
        data: { labels: airlineData.projected_years, datasets },
        options: commonChartOptions('Projected Revenue (₹ Cr)')
    });
}

function buildProjectedProfit() {
    const canvas = document.getElementById('projected-profit-chart');
    if (!canvas) return;
    const datasets = airlineData.airlines.map(a => {
        const data = airlineData.projected_years.map(y => {
            const idx = airlineData.years.indexOf(y);
            return airlineData.data[a].profit[idx];
        });
        return {
            label: a,
            data,
            borderColor: airlineData.data[a].color,
            backgroundColor: airlineData.data[a].color + '30',
            borderWidth: 3,
            borderDash: [8, 4],
            fill: true,
            tension: 0.4,
            pointBackgroundColor: data.map(v => v >= 0 ? '#16a34a' : '#dc2626'),
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
        };
    });
    charts.projProfit = new Chart(canvas, {
        type: 'line',
        data: { labels: airlineData.projected_years, datasets },
        options: commonChartOptions('Projected Profit / Loss (₹ Cr)', true)
    });
}

function buildMarketShare() {
    const canvas = document.getElementById('market-share-chart');
    if (!canvas) return;
    const fy24Revenue = { 'IndiGo': 73000, 'Air India': 65000, 'SpiceJet': 8497, 'Akasa Air': 3144 };
    const total = Object.values(fy24Revenue).reduce((sum, v) => sum + v, 0);
    const dataVals = Object.values(fy24Revenue).map(v => ((v / total) * 100).toFixed(1));
    charts.marketShare = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: Object.keys(fy24Revenue),
            datasets: [{
                data: dataVals,
                backgroundColor: airlineData.airlines.map(a => airlineData.data[a].color),
                borderColor: '#fff',
                borderWidth: 3,
                hoverBorderWidth: 4,
                hoverOffset: 10,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        color: '#1F2A55',
                        generateLabels: (chart) => {
                            const ds = chart.data.datasets[0];
                            return chart.data.labels.map((l, i) => ({
                                text: `${l}: ${ds.data[i]}%`,
                                fillStyle: ds.backgroundColor[i],
                                strokeStyle: ds.backgroundColor[i],
                                pointStyle: 'circle'
                            }));
                        }
                    }
                },
                tooltip: tooltipConfig()
            }
        }
    });
}

/************************************
 * UPDATE HELPERS
 ***********************************/
function getSelectedAirlines() {
    return Array.from(document.querySelectorAll('#airline-options input[type="checkbox"]:checked')).map(cb => cb.value);
}

function getFilteredYears() {
    const range = document.getElementById('year-range').value;
    if (range === 'historical') {
        return { years: airlineData.historical_years, indices: airlineData.historical_years.map(y => airlineData.years.indexOf(y)) };
    }
    if (range === 'projected') {
        return { years: airlineData.projected_years, indices: airlineData.projected_years.map(y => airlineData.years.indexOf(y)) };
    }
    return { years: airlineData.years, indices: airlineData.years.map((_, i) => i) };
}

function updateChartsForTab(tabKey) {
    switch (tabKey) {
        case 'revenue':
            const activeToggle = document.querySelector('#revenue-tab .chart-toggle.active');
            buildDynamicRevenue(activeToggle ? activeToggle.dataset.chart : 'line');
            break;
        case 'profit':
            buildDynamicProfit();
            break;
        case 'projections':
            if (!charts.projRevenue) buildProjectedRevenue();
            if (!charts.projProfit) buildProjectedProfit();
            break;
        case 'insights':
            if (!charts.marketShare) buildMarketShare();
            break;
        default:
            // overview - nothing dynamic required
            break;
    }
}

function updateCharts() {
    const activeKey = document.querySelector('.nav-tab.active').dataset.tab;
    updateChartsForTab(activeKey);
}

/************************************
 * METRICS (HEADER CARDS)
 ***********************************/
function updateMetrics() {
    const idxFY25 = airlineData.years.indexOf('FY2025');
    const idxFY24 = airlineData.years.indexOf('FY2024');
    airlineData.airlines.forEach(name => {
        const revenue25 = airlineData.data[name].revenue[idxFY25];
        const revenue24 = airlineData.data[name].revenue[idxFY24];
        const change = ((revenue25 - revenue24) / revenue24 * 100).toFixed(1);
        const idKey = name.toLowerCase().replace(/\s+/g, '-'); // e.g. akasa-air -> akasa-air but we need akasa
        document.getElementById(`${idKey}-revenue`).textContent = `₹${revenue25.toLocaleString()} Cr`;
        const changeEl = document.getElementById(`${idKey}-change`);
        changeEl.textContent = `${change >= 0 ? '+' : ''}${change}%`;
        changeEl.className = `metric-change ${change >= 0 ? 'positive' : 'negative'}`;
    });
}

/************************************
 * EXPORT DATA
 ***********************************/
function exportCharts() {
    const payload = {
        exportedAt: new Date().toISOString(),
        activeTab: document.querySelector('.nav-tab.active').dataset.tab,
        selectedAirlines: getSelectedAirlines(),
        filter: document.getElementById('year-range').value,
        dataset: airlineData,
        note: 'Exported from Indian Airlines Financial Dashboard (includes Akasa Air)'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indian-airlines-dashboard-${Date.now()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const btn = document.getElementById('export-btn');
    const original = btn.textContent;
    btn.textContent = 'Exported!';
    setTimeout(() => btn.textContent = original, 2000);
}

/************************************
 * RESPONSIVE RESIZE SUPPORT
 ***********************************/
window.addEventListener('resize', () => {
    Object.values(charts).forEach(ch => ch && ch.resize());
});
