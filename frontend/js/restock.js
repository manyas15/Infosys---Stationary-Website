async function fetchSuggestions() {
  const res = await fetch('/api/restock/suggestions?_=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load suggestions');
  return res.json();
}
let summaryChart = null;
let forecastChart = null;

async function fetchAllItems(){
  const res = await fetch('/api/items');
  if (!res.ok) throw new Error('Failed to load items');
  const data = await res.json();
  return data.items || [];
}

function renderSuggestions(suggestions) {
  const area = document.getElementById('suggestions-area');
  if (!suggestions || suggestions.length === 0) {
    // No suggestions: show helpful diagnostics so user can see why
    area.innerHTML = '<p>No restock suggestions at this time.</p><div id="restock-diagnostics" style="margin-top:12px"></div>';
    updateSummaryChart([], []);
    // fetch items and forecasts to provide diagnostics
    (async function showDiagnostics(){
      try {
        const items = await fetchAllItems();
        const fresp = await fetch('/api/forecast?horizon=7&_=' + Date.now(), { cache: 'no-store' });
        const fdata = fresp.ok ? await fresp.json() : null;
        const diag = document.getElementById('restock-diagnostics');
        const table = document.createElement('table');
        table.className = 'table';
        table.innerHTML = '<thead><tr><th>Product</th><th>Qty</th><th>Avg Daily (est)</th><th>7-day Forecast Sum</th><th>Reorder Level</th></tr></thead>';
        const tbody = document.createElement('tbody');
        items.forEach(it => {
          const forecastItem = fdata && fdata.results ? fdata.results.find(r=> String(r.id)===String(it.id) || r.name===it.name) : null;
          const forecastSum = forecastItem ? (forecastItem.forecast || []).reduce((a,b)=>a+b,0) : '';
          const avgDaily = forecastItem && Array.isArray(forecastItem.forecast) && forecastItem.forecast.length ? Math.round(forecastSum / forecastItem.forecast.length) : '';
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${it.name}</td><td>${it.quantity||0}</td><td>${avgDaily}</td><td>${forecastSum}</td><td>${it.reorderLevel||it.minThreshold||10}</td>`;
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        diag.appendChild(table);
      } catch (err) {
        console.warn('diagnostics failed', err);
      }
    })();
    return;
  }

  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `<thead><tr><th></th><th>Product</th><th>Current Qty</th><th>Reorder Level</th><th>Suggested Qty</th><th>Vendor</th></tr></thead>`;
  const tbody = document.createElement('tbody');
  suggestions.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="checkbox" data-id="${s.id}" data-name="${s.name}" data-qty="${s.suggestedQty}"></td>
      <td class="restock-name" data-id="${s.id}">${s.name}</td>
      <td>${s.quantity}</td>
      <td>${s.reorderLevel}</td>
      <td>${s.suggestedQty}</td>
      <td>${s.vendor || ''}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  area.innerHTML = '';
  area.appendChild(table);

  // Update summary chart with current vs suggested
  const labels = suggestions.map(s => s.name);
  const current = suggestions.map(s => s.quantity);
  const suggested = suggestions.map(s => s.suggestedQty);
  updateSummaryChart(labels, [{ label: 'Current', data: current }, { label: 'Suggested', data: suggested }]);

  // Update KPI values in rupees
  try {
    const items = await fetchAllItems();
    const itemMap = {}; items.forEach(i=> itemMap[i.id||i.sku||i.name]=i);
    const totalValue = items.reduce((sum,it)=> sum + (Number(it.quantity||0) * Number(it.price||0)), 0);
    const restockValue = suggestions.reduce((sum,s)=> sum + (Number(s.suggestedQty||0) * Number((itemMap[s.id]||{}).price || 0)), 0);
    const lowCount = suggestions.length;
    document.getElementById('kpi-total-value').textContent = `₹${totalValue.toLocaleString()}`;
    document.getElementById('kpi-restock-value').textContent = `₹${restockValue.toLocaleString()}`;
    document.getElementById('kpi-low-count').textContent = `${lowCount}`;

    // Prepare data for pie chart: available vs restock value
    const availableValue = Math.max(0, totalValue - restockValue);
    updatePieChart(['Available (₹)','To Restock (₹)'], [availableValue, restockValue]);

    // Prepare top restock bar chart by value
    const bars = suggestions.map(s => ({ name: s.name, value: (Number(s.suggestedQty||0) * Number((itemMap[s.id]||{}).price || 0)) }));
    bars.sort((a,b)=> b.value - a.value);
    updateTopBarChart(bars.slice(0,8).map(b=>b.name), bars.slice(0,8).map(b=>b.value));
  } catch (err) {
    console.warn('kpi update failed', err);
  }

  // Add click handler to show forecast for an item when name clicked
  const nameCells = document.querySelectorAll('.restock-name');
  nameCells.forEach(cell => {
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', async (e) => {
      const id = cell.dataset.id;
      try {
        await showForecastForItem(id, cell.textContent);
      } catch (err) {
        alert('Failed to load forecast: ' + err.message);
      }
    });
  });
}

async function createPoForSelected() {
  const supplier = document.getElementById('po-supplier').value || 'Unknown Supplier';
  const checkboxes = Array.from(document.querySelectorAll('#suggestions-area input[type="checkbox"]'));
  const lines = checkboxes.filter(c => c.checked).map(c => ({ id: c.dataset.id, name: c.dataset.name, qty: Number(c.dataset.qty) }));
  if (lines.length === 0) {
    alert('Select at least one item');
    return;
  }
  const res = await fetch('/api/restock/po', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplier, lines }),
  });
  if (!res.ok) {
    const txt = await res.text();
    alert('Failed to create PO: ' + txt);
    return;
  }
  const data = await res.json();
  const po = data.po;
  const result = document.getElementById('po-result');
  result.innerHTML = `<p>PO created: <strong>${po.id}</strong> - <a href="/api/restock/po/${po.id}/download">Download CSV</a></p>`;
}

function createChart(ctx, type, datasets, labels) {
  return new Chart(ctx, {
    type: type,
    data: { labels: labels || [], datasets: datasets.map((d, i) => ({
      label: d.label,
      data: d.data,
      backgroundColor: i === 0 ? 'rgba(59,130,246,0.6)' : 'rgba(34,197,94,0.6)',
      borderColor: i === 0 ? 'rgba(59,130,246,1)' : 'rgba(34,197,94,1)',
      borderWidth: 1,
    })) },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function updateSummaryChart(labels, datasets) {
  const ctx = document.getElementById('summaryChart').getContext('2d');
  if (!summaryChart) {
    summaryChart = createChart(ctx, 'bar', datasets, labels);
  } else {
    summaryChart.data.labels = labels;
    summaryChart.data.datasets = datasets.map((d, i) => ({
      label: d.label,
      data: d.data,
      backgroundColor: i === 0 ? 'rgba(59,130,246,0.6)' : 'rgba(34,197,94,0.6)',
      borderColor: i === 0 ? 'rgba(59,130,246,1)' : 'rgba(34,197,94,1)',
    }));
    summaryChart.update();
  }
}

let pieChart=null;
function updatePieChart(labels, values){
  const ctx = document.getElementById('summaryChart').getContext('2d');
  // reuse same chart area as a doughnut by swapping
  if (pieChart) {
    pieChart.data.labels = labels;
    pieChart.data.datasets[0].data = values;
    pieChart.update();
    return;
  }
  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: values, backgroundColor: ['rgba(59,130,246,0.8)','rgba(245,158,11,0.85)'] }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom'}} }
  });
}

let topBarChart=null;
function updateTopBarChart(labels, values){
  const canvas = document.createElement('canvas');
  canvas.style.width='100%';
  canvas.height = 180;
  const detailArea = document.getElementById('detailArea');
  // replace or append
  const existing = document.getElementById('topBarChart');
  if (existing) existing.remove();
  canvas.id = 'topBarChart';
  detailArea.insertBefore(canvas, detailArea.firstChild);
  const ctx = canvas.getContext('2d');
  topBarChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Restock Value (₹)', data: values, backgroundColor:'rgba(244,114,182,0.8)' }] },
    options: { responsive:true, maintainAspectRatio:false, scales:{y:{beginAtZero:true}} }
  });
}

async function showForecastForItem(id, name) {
  // Get forecast for all items and pick requested id
  const res = await fetch('/api/forecast?horizon=14&_=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Forecast API failed');
  const data = await res.json();
  console.log('forecast payload', data);
  const item = (data.results || []).find(r => String(r.id) === String(id) || r.name === name);
  if (!item) {
    document.getElementById('forecastNotes').style.display = 'block';
    document.getElementById('forecastNotes').textContent = 'No forecast available for selected item.';
    return;
  }
  document.getElementById('forecastNotes').style.display = 'none';
  // Show whether the forecast is from live model or fallback
  if (item.source) {
    document.getElementById('forecastNotes').style.display = 'block';
    document.getElementById('forecastNotes').textContent = 'Forecast source: ' + item.source;
  }
  const labels = item.forecast.map((_, idx) => `Day ${idx+1}`);
  const datasets = [
    { label: 'Forecast demand', data: item.forecast }
  ];

  const ctx = document.getElementById('forecastChart').getContext('2d');
  if (!forecastChart) forecastChart = createChart(ctx, 'line', datasets, labels);
  else {
    forecastChart.data.labels = labels;
    forecastChart.data.datasets = datasets.map(d => ({ label: d.label, data: d.data, borderColor: 'rgba(245,158,11,1)', backgroundColor: 'rgba(245,158,11,0.15)' }));
    forecastChart.update();
  }
}

document.getElementById('get-suggestions').addEventListener('click', async () => {
  try {
    const data = await fetchSuggestions();
    renderSuggestions(data.suggestions);
  } catch (err) {
    alert('Error loading suggestions: ' + err.message);
  }
});

document.getElementById('create-po').addEventListener('click', async () => {
  try {
    await createPoForSelected();
  } catch (err) {
    alert('Error creating PO: ' + err.message);
  }
});

// Auto-load suggestions on page open for convenience
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('get-suggestions');
  if (btn) btn.click();
});
