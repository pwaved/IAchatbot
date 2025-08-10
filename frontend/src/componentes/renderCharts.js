// analytics-charts.js

import Chart from 'chart.js/auto';

const isDarkMode = () => document.documentElement.classList.contains('dark');
let topSearchesChartInstance = null;

const analyticsChartManager = {
    charts: {},

    updateDefaults() {
        const textColor = isDarkMode() ? 'rgba(255, 255, 255, 0.85)' : 'rgba(31, 41, 55, 0.9)';
        const gridColor = isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(229, 231, 235, 1)';

        Chart.defaults.color = textColor;
        Chart.defaults.scale.grid.color = gridColor;
        Chart.defaults.scale.ticks.color = textColor;
    },

    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    },

    renderAll(data) {
        this.destroyChart('feedbackChart');
        this.destroyChart('categoryChart');
        this.destroyChart('subcategoryChart');

        if (data) {
            this.renderFeedbackChart(data.feedbackStats);
            this.renderCategoryChart(data.categoryStats);
            this.renderSubcategoryChart(data.subcategoryStats);
        }
    },

    renderFeedbackChart(feedbackStats) {
        const ctx = document.getElementById('feedbackChart')?.getContext('2d');
        if (!ctx || !feedbackStats) return;

        const usefulCount = feedbackStats.find(item => item.satisfatorio === true)?.count || 0;
        const notUsefulCount = feedbackStats.find(item => item.satisfatorio === false)?.count || 0;

        this.charts.feedbackChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Úteis', 'Não Úteis'],
                datasets: [{
                    data: [usefulCount, notUsefulCount],
                    backgroundColor: ['#10B981', '#EF4444'],
                    borderColor: isDarkMode() ? '#111827' : '#FFFFFF',
                    borderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { position: 'bottom' } }
            }
        });
    },

    renderCategoryChart(categoryStats) {
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx || !categoryStats) return;

        this.charts.categoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoryStats.map(c => c.nome),
                datasets: [{
                    label: 'Documentos',
                    data: categoryStats.map(c => c.documentCount),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    },

    renderSubcategoryChart(subcategoryStats) {
        const ctx = document.getElementById('subcategoryChart')?.getContext('2d');
        if (!ctx || !subcategoryStats) return;

        this.charts.subcategoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: subcategoryStats.map(s => s.nome),
                datasets: [{
                    label: 'Documentos',
                    data: subcategoryStats.map(s => s.documentCount),
                    backgroundColor: 'rgba(249, 115, 22, 0.7)',
                    borderColor: 'rgba(249, 115, 22, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { display: false } }
            }
        });
    },

    renderTopSearchesChart(searchData) {
    const ctx = document.getElementById('topSearchesChart');
    const selector = document.getElementById('category-search-selector');

    if (!ctx || !selector) return;

    // Substitui o seletor para limpar listeners antigos
    selector.replaceWith(selector.cloneNode(true));
    const newSelector = document.getElementById('category-search-selector');

    if (topSearchesChartInstance) {
        topSearchesChartInstance.destroy();
    }

    if (!searchData || searchData.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center text-neutral-500 dark:text-neutral-400 mt-8">Não há dados de pesquisa para exibir.</p>';
        newSelector.innerHTML = '<option>Nenhuma categoria</option>';
        return;
    }

    newSelector.innerHTML = searchData.map(item => `<option value="${item.category}">${item.category}</option>`).join('');

    const updateChart = (categoryName) => {
        const isDarkMode = () => document.documentElement.classList.contains('dark');
        const textColor = isDarkMode() ? '#cbd5e1' : '#8f9bb3';
        const gridColor = isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(229, 231, 235, 1)';

        const categoryData = searchData.find(d => d.category === categoryName);
        if (!categoryData) return;

        const labels = categoryData.searches.map(s => s.term);
        const data = categoryData.searches.map(s => s.count);

        if (topSearchesChartInstance) {
            topSearchesChartInstance.data.labels = labels;
            topSearchesChartInstance.data.datasets[0].data = data;
            topSearchesChartInstance.options.plugins.title.text = `Principais buscas para "${categoryName}"`;
            topSearchesChartInstance.options.scales.x.ticks.color = textColor;
            topSearchesChartInstance.options.scales.y.ticks.color = textColor;
            topSearchesChartInstance.options.plugins.title.color = textColor;
            topSearchesChartInstance.options.scales.x.grid.color = gridColor;
            topSearchesChartInstance.update();
        } else {
            topSearchesChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Nº de Buscas',
                        data,
                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: `Principais buscas para "${categoryName}"`,
                            color: textColor
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            grid: { color: gridColor },
                            ticks: {
                                color: textColor,
                                precision: 0
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: textColor }
                        }
                    }
                }
            });
        }
    };

    newSelector.addEventListener('change', (e) => {
        updateChart(e.target.value);
    });

    updateChart(searchData[0].category);


    if (!window.themeListener) {
        window.themeListener = () => {
            if (topSearchesChartInstance) {
                updateChart(newSelector.value);
            }
        };
        document.documentElement.addEventListener('classChange', window.themeListener);
    }
},
};

export default analyticsChartManager;
