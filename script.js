document.addEventListener('DOMContentLoaded', () => {
    // --- Data Definition ---
    const useRealData = typeof REAL_DATA !== 'undefined';
    
    // Filter out "OUTROS" for Overview charts
    const rawConvenios = useRealData ? REAL_DATA.convenios : [];
    const filteredConvenios = rawConvenios.filter(c => !c.name.includes('OUTROS'));
    
    const convenios = useRealData ? filteredConvenios : [
        { name: 'Unimed', color: '#4f46e5', data: [150000, 155000, 148000, 165000, 158000, 172000] },
        { name: 'Bradesco Saúde', color: '#10b981', data: [95000, 98000, 102000, 105000, 108000, 115000] },
        { name: 'SulAmérica', color: '#f59e0b', data: [70000, 72000, 75000, 71000, 78000, 82000] },
        { name: 'Amil', color: '#3b82f6', data: [50000, 52000, 48000, 55000, 53000, 58000] },
        { name: 'Casssi', color: '#8b5cf6', data: [35000, 37000, 36000, 38000, 39000, 42000] }
    ];

    const months = useRealData ? REAL_DATA.months : ['Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'];

    // Update Stats Cards (Full data for totals)
    const lastMonthIdx = months.length - 1;
    const prevMonthIdx = lastMonthIdx > 0 ? lastMonthIdx - 1 : 0;
    
    // Sum using all data (including OUTROS)
    const totalBillingLastMonth = rawConvenios.reduce((acc, c) => acc + c.data[lastMonthIdx], 0);
    const totalBillingPrevMonth = rawConvenios.reduce((acc, c) => acc + c.data[prevMonthIdx], 0);
    
    // Calculation: Growth
    const totalDiff = totalBillingLastMonth - totalBillingPrevMonth;
    const totalPerc = totalBillingPrevMonth > 0 ? (totalDiff / totalBillingPrevMonth * 100).toFixed(1) : 0;
    
    // Update DOM
    document.getElementById('stat-total-billing').textContent = 
        `R$ ${totalBillingLastMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    document.getElementById('stat-total-billing').parentElement.querySelector('.stat-label').textContent = 
        `Faturamento (${months[lastMonthIdx]})`;
    
    document.getElementById('stat-total-trend').innerHTML = 
        `<span style="color: ${totalDiff >= 0 ? 'var(--success)' : 'var(--danger)'}">
            <i class="fas fa-${totalDiff >= 0 ? 'arrow-up' : 'arrow-down'}"></i> ${Math.abs(totalPerc)}%
        </span> vs ${months[prevMonthIdx]}`;

    // Growth Card
    document.getElementById('stat-growth-value').textContent = `${totalPerc > 0 ? '+' : ''}${totalPerc}%`;
    document.getElementById('stat-growth-trend').textContent = totalPerc >= 0 ? 'Expansão de Receita' : 'Retração de Receita';
    document.getElementById('stat-growth-value').style.color = totalPerc >= 0 ? 'var(--success)' : 'var(--danger)';

    // Best convenio name should be from filtered (real names)
    const bestConvenio = [...filteredConvenios].sort((a, b) => b.data[lastMonthIdx] - a.data[lastMonthIdx])[0]; 
    
    if (bestConvenio) {
        document.getElementById('stat-best-convenio').textContent = bestConvenio.name;
        document.getElementById('stat-best-trend').innerHTML = `<i class="fas fa-medal" style="color: var(--warning)"></i> Top Performance`;
    }

    // --- Summary Table Logic (Resumo Mensal) ---
    const summaryHeader = document.getElementById('summary-header');
    const summaryBody = document.getElementById('summary-body');
    const searchSummaryInput = document.getElementById('search-summary');

    function renderSummaryTable(filter = '') {
        if (!summaryHeader || !summaryBody) return;
        
        summaryHeader.innerHTML = '<th>Convênio</th>';
        months.forEach(m => summaryHeader.innerHTML += `<th style="text-align: right;">${m}</th>`);

        summaryBody.innerHTML = '';
        
        // Use all ranking data
        const tableData = (useRealData && REAL_DATA.full_ranking) ? REAL_DATA.full_ranking : convenios;
        
        // Filtering data
        const filteredData = tableData.filter(c => !filter || c.name.toLowerCase().includes(filter.toLowerCase()));

        // Sorting by total period billing
        const sortedData = [...filteredData].sort((a, b) => {
            const totalA = a.total || a.data.reduce((acc, v) => acc + v, 0);
            const totalB = b.total || b.data.reduce((acc, v) => acc + v, 0);
            return totalB - totalA;
        });

        // Add TOTAL Row at the TOP
        if (sortedData.length > 0) {
            const rowTotal = document.createElement('tr');
            rowTotal.style.backgroundColor = '#f8fafc';
            rowTotal.style.borderBottom = '2px solid var(--border)';
            
            let htmlTotal = `<td style="font-weight: 800; color: var(--primary);">TOTAL CONSOLIDADO</td>`;
            months.forEach((_, i) => {
                const monthTotal = sortedData.reduce((acc, c) => acc + c.data[i], 0);
                htmlTotal += `<td style="text-align: right; font-weight: 800; color: var(--primary);">R$ ${monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>`;
            });
            rowTotal.innerHTML = htmlTotal;
            summaryBody.appendChild(rowTotal);
        }

        sortedData.forEach(c => {
            const row = document.createElement('tr');
            let rowHtml = `<td style="font-weight: 600; min-width: 250px;">${c.name}</td>`;
            
            c.data.forEach((val, i) => {
                let variationHtml = '';
                if (i > 0) {
                    const prevVal = c.data[i-1];
                    if (prevVal > 0) {
                        const diff = ((val - prevVal) / prevVal * 100).toFixed(0);
                        const type = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'neutral');
                        variationHtml = `<span class="variation variation-${type}">${diff > 0 ? '+' : ''}${diff}%</span>`;
                    }
                }
                rowHtml += `<td style="text-align: right;">
                    R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    <br>${variationHtml}
                </td>`;
            });
            
            row.innerHTML = rowHtml;
            summaryBody.appendChild(row);
        });
    }

    if (searchSummaryInput) {
        searchSummaryInput.addEventListener('input', (e) => {
            renderSummaryTable(e.target.value);
        });
    }
    
    renderSummaryTable();

    // --- Tab Logic ---
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = link.getAttribute('data-tab');
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            link.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- Overview Charts ---

    // 1. Bar Chart (Filtered)
    const ctxBar = document.getElementById('barChartBilling').getContext('2d');
    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: convenios.slice(0, 8).map(c => c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name),
            datasets: [{
                label: 'Faturamento (R$)',
                data: convenios.slice(0, 8).map(c => c.data[lastMonthIdx]),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                hoverBackgroundColor: 'rgba(99, 102, 241, 1)',
                borderRadius: 8,
                barThickness: 32
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 2000, easing: 'easeOutQuart' },
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    titleFont: { size: 14, weight: '600' },
                    bodyFont: { size: 13 },
                    callbacks: { label: (ctx) => `Receita: R$ ${ctx.raw.toLocaleString('pt-BR')}` }
                }
            },
            scales: { 
                y: { 
                    beginAtZero: true, 
                    grid: { display: false },
                    ticks: { callback: v => 'R$ ' + (v/1000) + 'k', color: '#94a3b8' } 
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            }
        }
    });

    // 2. Pie Chart (Filtered)
    const ctxPie = document.getElementById('pieChartDistribution').getContext('2d');
    new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: convenios.slice(0, 10).map(c => c.name),
            datasets: [{
                data: convenios.slice(0, 10).map(c => c.data[lastMonthIdx]),
                backgroundColor: [
                    '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6',
                    '#f43f5e', '#0ea5e9', '#d946ef', '#f97316', '#84cc16'
                ],
                borderWidth: 4,
                borderColor: '#ffffff',
                hoverOffset: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            animation: { animateRotate: true, animateScale: true, duration: 2000 },
            plugins: { 
                legend: { 
                    position: 'right', 
                    labels: { usePointStyle: true, font: { size: 11, family: 'Inter' }, padding: 20 } 
                },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12
                }
            }
        }
    });

    // 3. Line Chart: Total Evolution (Overview)
    const ctxLineTotal = document.getElementById('lineChartTotalEvolution').getContext('2d');
    const gradient = ctxLineTotal.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    const monthlyTotalsEvolution = months.map((_, i) => rawConvenios.reduce((acc, c) => acc + c.data[i], 0));

    new Chart(ctxLineTotal, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Faturamento Total (R$)',
                data: monthlyTotalsEvolution,
                borderColor: '#6366f1',
                backgroundColor: gradient,
                borderWidth: 4,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#6366f1',
                pointHoverBorderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    padding: 12,
                    callbacks: { label: (ctx) => `Faturamento: R$ ${ctx.raw.toLocaleString('pt-BR')}` }
                }
            },
            scales: { 
                y: { 
                    grid: { color: 'rgba(226, 232, 240, 0.5)', drawBorder: false },
                    ticks: { callback: v => 'R$ ' + (v/1000) + 'k', color: '#94a3b8' } 
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // --- Evolution Tab Logic (Checkboxes & Table) ---
    const checkboxContainer = document.getElementById('checkbox-container');
    const evolutionHeader = document.getElementById('evolution-header');
    const evolutionBody = document.getElementById('evolution-body');
    const selectedTotalValue = document.getElementById('selected-total-value');
    const selectedAverageValue = document.getElementById('selected-average-value');
    const filterCheckboxesInput = document.getElementById('filter-checkboxes');
    
    const tableDataEvol = (useRealData && REAL_DATA.full_ranking) ? REAL_DATA.full_ranking : convenios;
    let selectedConvenios = new Set(tableDataEvol.slice(0, 10).map(c => c.name)); // Default top 10

    function updateEvolutionDashboard() {
        if (!evolutionHeader || !evolutionBody) return;
        
        // Update Header
        evolutionHeader.innerHTML = '<th>Convênio</th>';
        months.forEach(m => evolutionHeader.innerHTML += `<th style="text-align: right;">${m}</th>`);

        // Update Body & Calculate Total
        evolutionBody.innerHTML = '';
        let grandTotalSelected = 0;

        tableDataEvol.forEach(c => {
            if (!selectedConvenios.has(c.name)) return;

            const row = document.createElement('tr');
            let rowHtml = `<td style="font-weight: 600;">${c.name}</td>`;
            
            c.data.forEach((val, i) => {
                grandTotalSelected += val;
                let variationHtml = '';
                if (i > 0) {
                    const prevVal = c.data[i-1];
                    if (prevVal > 0) {
                        const diff = ((val - prevVal) / prevVal * 100).toFixed(0);
                        const type = diff > 0 ? 'up' : (diff < 0 ? 'down' : 'neutral');
                        variationHtml = `<span class="variation variation-${type}">${diff > 0 ? '+' : ''}${diff}%</span>`;
                    }
                }
                rowHtml += `<td style="text-align: right;">R$ ${val.toLocaleString('pt-BR')}<br>${variationHtml}</td>`;
            });
            row.innerHTML = rowHtml;
            evolutionBody.appendChild(row);
        });

        selectedTotalValue.textContent = `R$ ${grandTotalSelected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        
        // Calculate Average
        const numMonths = months.length;
        const average = numMonths > 0 ? (grandTotalSelected / numMonths) : 0;
        selectedAverageValue.textContent = `R$ ${average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    function renderCheckboxes(filter = '') {
        checkboxContainer.innerHTML = '';
        tableDataEvol.forEach(c => {
            if (filter && !c.name.toLowerCase().includes(filter.toLowerCase())) return;

            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.gap = '8px';
            div.style.fontSize = '0.8rem';
            
            const isChecked = selectedConvenios.has(c.name);
            div.innerHTML = `
                <input type="checkbox" id="chk-${c.name}" ${isChecked ? 'checked' : ''}>
                <label for="chk-${c.name}" style="cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.name}">${c.name}</label>
            `;
            
            div.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) selectedConvenios.add(c.name);
                else selectedConvenios.delete(c.name);
                updateEvolutionDashboard();
            });
            
            checkboxContainer.appendChild(div);
        });
    }

    if (filterCheckboxesInput) {
        filterCheckboxesInput.addEventListener('input', (e) => {
            renderCheckboxes(e.target.value);
        });
    }

    document.getElementById('select-all').addEventListener('click', () => {
        tableDataEvol.forEach(c => selectedConvenios.add(c.name));
        renderCheckboxes(filterCheckboxesInput ? filterCheckboxesInput.value : '');
        updateEvolutionDashboard();
    });

    document.getElementById('deselect-all').addEventListener('click', () => {
        selectedConvenios.clear();
        renderCheckboxes(filterCheckboxesInput ? filterCheckboxesInput.value : '');
        updateEvolutionDashboard();
    });

    renderCheckboxes();
    updateEvolutionDashboard();

    // Current Date
    const options = { year: 'numeric', month: 'long' };
    document.getElementById('current-date').textContent = `Análise de Faturamento - ${new Date().toLocaleDateString('pt-BR', options)}`;
});
