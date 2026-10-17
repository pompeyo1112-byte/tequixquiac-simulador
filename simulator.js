let defaults = {
  scenario: "Base",
  businesses: [
    { id: "gym", name: "Gimnasio", group: "Deporte", active: true, units: 320, unitLabel: "Socios", price: 450, days: 1, variable: .08, fixed: 98000, capex: 4000000 },
    { id: "padel", name: "Pádel", group: "Deporte", active: true, units: 8, unitLabel: "Horas vendidas / día", price: 320, days: 30, variable: .12, fixed: 47000, capex: 1800000 },
    { id: "pizza", name: "Pizzería genérica", group: "Franquicia / alimentos", active: true, units: 100, unitLabel: "Tickets / día", price: 170, days: 30, variable: .62, fixed: 140000, capex: 1900000 },
    { id: "cafe", name: "Cafetería propia", group: "Comercial propio", active: true, units: 55, unitLabel: "Tickets / día", price: 95, days: 30, variable: .36, fixed: 89000, capex: 650000 },
    { id: "pharmacy", name: "Farmacia genérica", group: "Franquicia / comercial", active: false, units: 75, unitLabel: "Tickets / día", price: 100, days: 30, variable: .72, fixed: 59000, capex: 850000 },
    { id: "water", name: "Agua purificada", group: "Franquicia / servicios", active: false, units: 75, unitLabel: "Garrafones / día", price: 23, days: 30, variable: .30, fixed: 27000, capex: 250000 },
  ],
  investments: [
    { id: "construction", name: "Locales: obra y acabados", group: "Construcción", active: true, amount: 4200000 },
    { id: "infrastructure", name: "Urbanización e infraestructura", group: "Infraestructura", active: true, amount: 2300000 },
    { id: "contingency", name: "Contingencia y capital inicial", group: "Reserva", active: true, amount: 2000000 },
    { id: "licenses", name: "Licencias, proyecto y preapertura", group: "Preoperación", active: true, amount: 400000 },
  ],
  finance: { commonFixed: 30000, salesGrowth: .04, expenseGrowth: .045, discount: .16, tax: .30, replacement: .02, workingCapital: .02 },
  scenarios: {
    Conservador: { volume: .75, variableDelta: .03, fixedDelta: .05 },
    Base: { volume: 1, variableDelta: 0, fixedDelta: 0 },
    Alto: { volume: 1.30, variableDelta: -.02, fixedDelta: .05 },
  },
};

let state = structuredClone(defaults);
let openBusiness = "gym";

const $ = (selector) => document.querySelector(selector);
const fmtMoney = (value, compact = false) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0, notation: compact ? "compact" : "standard" }).format(value || 0);
const fmtPct = (value) => new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 1 }).format(value || 0);
const fmtNumber = (value, digits = 0) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: digits }).format(value || 0);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const cloneDefaults = () => structuredClone(defaults);

function getLimits(key, item) {
  const limits = {
    units: [0, item.id === "gym" ? 800 : 250, 1], price: [0, item.id === "gym" ? 1200 : 500, 5], days: [1, 31, 1],
    variable: [0, .9, .01], fixed: [0, 350000, 5000], capex: [0, 10000000, 50000], amount: [0, 10000000, 50000],
    commonFixed: [0, 250000, 5000], salesGrowth: [-.10, .20, .005], expenseGrowth: [-.10, .20, .005], discount: [0, .40, .005], tax: [0, .45, .01], replacement: [0, .10, .005], workingCapital: [0, .15, .005],
  };
  return limits[key];
}

function controlRow({ label, value, key, path, kind = "number", suffix = "" }) {
  const [min, max, step] = getLimits(key, path.item || {});
  const display = kind === "percent" ? (value * 100).toFixed(1) : Math.round(value);
  const inputStep = kind === "percent" ? step * 100 : step;
  const inputMin = kind === "percent" ? min * 100 : min;
  const inputMax = kind === "percent" ? max * 100 : max;
  return `<div class="control-row">
    <label class="control-label"><span>${label}</span><span><input class="number-box linked-number" type="number" min="${inputMin}" max="${inputMax}" step="${inputStep}" value="${display}" data-path="${path.value}" data-kind="${kind}" />${suffix}</span></label>
    <div class="slider-line"><input class="linked-range" type="range" min="${inputMin}" max="${inputMax}" step="${inputStep}" value="${display}" data-path="${path.value}" data-kind="${kind}" aria-label="${label}" /></div>
  </div>`;
}

function renderControls() {
  $("#businessControls").innerHTML = state.businesses.map((b, i) => `
    <article class="business-card ${b.active ? "active" : ""} ${openBusiness === b.id ? "open" : ""}">
      <button class="business-head" type="button" data-open-business="${b.id}">
        <span><strong>${b.name}</strong><small>${b.group}</small></span>
        <span class="business-actions"><span class="toggle ${b.active ? "on" : ""}" role="switch" aria-checked="${b.active}" data-toggle-business="${i}"></span><span class="chevron">⌄</span></span>
      </button>
      <div class="business-fields">
        ${controlRow({ label: b.unitLabel, value: b.units, key: "units", path: { value: `businesses.${i}.units`, item: b } })}
        ${controlRow({ label: "Precio o ticket", value: b.price, key: "price", path: { value: `businesses.${i}.price`, item: b }, suffix: " MXN" })}
        ${controlRow({ label: "Días operados al mes", value: b.days, key: "days", path: { value: `businesses.${i}.days`, item: b } })}
        ${controlRow({ label: "Costo variable", value: b.variable, key: "variable", path: { value: `businesses.${i}.variable`, item: b }, kind: "percent", suffix: "%" })}
        ${controlRow({ label: "Gasto fijo mensual", value: b.fixed, key: "fixed", path: { value: `businesses.${i}.fixed`, item: b }, suffix: " MXN" })}
        ${controlRow({ label: "Inversión del negocio", value: b.capex, key: "capex", path: { value: `businesses.${i}.capex`, item: b }, suffix: " MXN" })}
      </div>
    </article>`).join("");

  $("#investmentControls").innerHTML = state.investments.map((item, i) => `
    <div class="inline-toggle-row"><span><strong>${item.name}</strong><small>${item.group}</small></span><button class="toggle ${item.active ? "on" : ""}" type="button" data-toggle-investment="${i}" aria-label="Activar ${item.name}"></button></div>
    ${controlRow({ label: "Monto estimado", value: item.amount, key: "amount", path: { value: `investments.${i}.amount`, item }, suffix: " MXN" })}
  `).join("");

  const f = state.finance;
  const financeItems = [
    ["Gasto común mensual", "commonFixed", "number", " MXN"], ["Crecimiento anual de ventas", "salesGrowth", "percent", "%"],
    ["Incremento anual de gastos", "expenseGrowth", "percent", "%"], ["Tasa de descuento", "discount", "percent", "%"],
    ["Impuesto efectivo", "tax", "percent", "%"], ["Reposición anual sobre inversión", "replacement", "percent", "%"],
    ["Capital de trabajo sobre ventas", "workingCapital", "percent", "%"],
  ];
  $("#financeControls").innerHTML = financeItems.map(([label, key, kind, suffix]) => controlRow({ label, value: f[key], key, path: { value: `finance.${key}`, item: {} }, kind, suffix })).join("");

  $("#scenarioControls").innerHTML = Object.entries(state.scenarios).map(([name, values]) => `<div class="scenario-row"><strong>${name}</strong><div class="scenario-mini-grid">
    <label>Volumen<input type="number" value="${(values.volume * 100).toFixed(0)}" step="1" data-scenario="${name}" data-scenario-key="volume" />%</label>
    <label>Δ variable<input type="number" value="${(values.variableDelta * 100).toFixed(1)}" step="0.5" data-scenario="${name}" data-scenario-key="variableDelta" />%</label>
    <label>Δ fijos<input type="number" value="${(values.fixedDelta * 100).toFixed(1)}" step="0.5" data-scenario="${name}" data-scenario-key="fixedDelta" />%</label>
  </div></div>`).join("");
}

function setPath(path, value) {
  const parts = path.split(".");
  let target = state;
  for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]];
  target[parts.at(-1)] = value;
}

function scenarioResult(name) {
  const s = state.scenarios[name];
  let sales = 0, variable = 0, fixed = state.finance.commonFixed * (1 + s.fixedDelta);
  state.businesses.forEach(b => {
    if (!b.active) return;
    const itemSales = b.units * b.price * b.days * s.volume;
    sales += itemSales;
    variable += itemSales * clamp(b.variable + s.variableDelta, 0, .98);
    fixed += b.fixed * (1 + s.fixedDelta);
  });
  return { sales, variable, fixed, ebitda: sales - variable - fixed };
}

function calculate() {
  const s = state.scenarios[state.scenario];
  const rows = state.businesses.map(b => {
    if (!b.active) return { ...b, sales: 0, variableCost: 0, fixedCost: 0, ebitda: 0, margin: 0, breakEven: 0 };
    const sales = b.units * b.price * b.days * s.volume;
    const variableRate = clamp(b.variable + s.variableDelta, 0, .98);
    const variableCost = sales * variableRate;
    const fixedCost = b.fixed * (1 + s.fixedDelta);
    const ebitda = sales - variableCost - fixedCost;
    return { ...b, sales, variableCost, fixedCost, ebitda, margin: sales ? ebitda / sales : 0, breakEven: fixedCost / (1 - variableRate) };
  });
  const sales = rows.reduce((a, b) => a + b.sales, 0);
  const variable = rows.reduce((a, b) => a + b.variableCost, 0);
  const fixed = rows.reduce((a, b) => a + b.fixedCost, 0) + state.finance.commonFixed * (1 + s.fixedDelta);
  const ebitda = sales - variable - fixed;
  const baseInvestment = state.investments.reduce((a, x) => a + (x.active ? x.amount : 0), 0);
  const businessInvestment = state.businesses.reduce((a, x) => a + (x.active ? x.capex : 0), 0);
  const investment = baseInvestment + businessInvestment;
  const flow = [{ year: 0, net: -investment, cumulative: -investment }];
  let revenue = sales * 12, variableAnnual = variable * 12, fixedAnnual = fixed * 12;
  for (let year = 1; year <= 10; year++) {
    if (year > 1) { revenue *= 1 + state.finance.salesGrowth; variableAnnual *= 1 + state.finance.salesGrowth; fixedAnnual *= 1 + state.finance.expenseGrowth; }
    const yearEbitda = revenue - variableAnnual - fixedAnnual;
    const tax = Math.max(0, yearEbitda * state.finance.tax);
    const replacement = investment * state.finance.replacement;
    const prevRevenue = year === 1 ? 0 : flow[year - 1].revenue;
    const workingCapital = year === 1 ? revenue * state.finance.workingCapital : Math.max(0, (revenue - prevRevenue) * state.finance.workingCapital);
    const net = yearEbitda - tax - replacement - workingCapital;
    flow.push({ year, revenue, ebitda: yearEbitda, net, cumulative: flow.at(-1).cumulative + net });
  }
  const npv = flow.slice(1).reduce((sum, x, i) => sum + x.net / Math.pow(1 + state.finance.discount, i + 1), -investment);
  const irr = computeIRR(flow.map(x => x.net));
  const payback = ebitda > 0 ? investment / (ebitda * 12) : Infinity;
  const scenarioResults = Object.keys(state.scenarios).map(name => ({ name, ...scenarioResult(name) }));
  return { rows, sales, variable, fixed, ebitda, margin: sales ? ebitda / sales : 0, baseInvestment, businessInvestment, investment, flow, npv, irr, payback, scenarioResults };
}

function computeIRR(cashFlows) {
  let low = -.999, high = 5;
  const npvAt = rate => cashFlows.reduce((sum, cf, i) => sum + cf / Math.pow(1 + rate, i), 0);
  if (npvAt(low) * npvAt(high) > 0) return NaN;
  for (let i = 0; i < 120; i++) { const mid = (low + high) / 2; if (npvAt(low) * npvAt(mid) <= 0) high = mid; else low = mid; }
  return (low + high) / 2;
}

function renderDashboard() {
  const r = calculate();
  $("#scenarioBadge").textContent = `Escenario ${state.scenario}`;
  $("#scenarioSelect").value = state.scenario;
  $("#kpiSales").textContent = fmtMoney(r.sales, true);
  $("#kpiActive").textContent = `${state.businesses.filter(x => x.active).length} negocios activos`;
  $("#kpiEbitda").textContent = fmtMoney(r.ebitda, true);
  $("#kpiEbitda").className = r.ebitda < 0 ? "negative" : "positive";
  $("#kpiMargin").textContent = `Margen ${fmtPct(r.margin)}`;
  $("#kpiInvestment").textContent = fmtMoney(r.investment, true);
  $("#kpiReturn").textContent = `Retorno operativo ${fmtPct(r.investment ? r.ebitda * 12 / r.investment : 0)}`;
  $("#kpiPayback").textContent = Number.isFinite(r.payback) ? `${fmtNumber(r.payback, 1)} años` : "No recupera";
  $("#kpiNpv").textContent = fmtMoney(r.npv, true);
  $("#kpiNpv").className = r.npv < 0 ? "negative" : "positive";
  $("#kpiIrr").textContent = `TIR ${Number.isFinite(r.irr) ? fmtPct(r.irr) : "no disponible"}`;
  if (r.ebitda <= 0) {
    $("#decisionTitle").textContent = "La operación no cubre sus costos";
    $("#decisionText").textContent = "El escenario seleccionado requiere más volumen, mayor margen o una estructura de costos más ligera antes de evaluar el retorno de la inversión.";
  } else if (r.npv < 0) {
    $("#decisionTitle").textContent = "Operación positiva, retorno insuficiente";
    $("#decisionText").textContent = "El proyecto cubre su operación mensual, pero el flujo descontado todavía no compensa la inversión dentro del horizonte de diez años.";
  } else {
    $("#decisionTitle").textContent = "Rentabilidad financiera preliminar positiva";
    $("#decisionText").textContent = "Bajo estos supuestos, la operación y el retorno superan el criterio financiero establecido. Confirma las variables con evidencia antes de decidir.";
  }

  $("#businessTable").innerHTML = r.rows.map(x => `<tr><td>${x.name}</td><td><span class="status-pill ${x.active ? "" : "off"}">${x.active ? "Activo" : "Inactivo"}</span></td><td>${fmtMoney(x.sales)}</td><td class="${x.ebitda < 0 ? "negative" : ""}">${fmtMoney(x.ebitda)}</td><td>${fmtPct(x.margin)}</td><td>${fmtMoney(x.breakEven)}</td></tr>`).join("");
  renderBusinessChart(r.rows);
  renderScenarioChart(r.scenarioResults);
  renderInvestmentChart(r);
  renderFlowChart(r.flow);
}

function svgBarChart(data, options = {}) {
  const width = options.width || 760, height = options.height || 280;
  const margin = { top: 20, right: 18, bottom: 52, left: 58 };
  const allValues = data.flatMap(d => d.values);
  const min = Math.min(0, ...allValues), max = Math.max(1, ...allValues);
  const range = max - min || 1;
  const xBand = (width - margin.left - margin.right) / data.length;
  const groupWidth = xBand * .68;
  const barWidth = groupWidth / (data[0]?.values.length || 1);
  const y = v => margin.top + (max - v) / range * (height - margin.top - margin.bottom);
  const zeroY = y(0);
  let html = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">`;
  for (let i = 0; i <= 4; i++) { const value = min + range * i / 4; const yy = y(value); html += `<line x1="${margin.left}" y1="${yy}" x2="${width-margin.right}" y2="${yy}" class="grid-line"/><text x="${margin.left-8}" y="${yy+3}" text-anchor="end" class="axis-label">${fmtMoney(value,true)}</text>`; }
  html += `<line x1="${margin.left}" y1="${zeroY}" x2="${width-margin.right}" y2="${zeroY}" class="zero-line"/>`;
  data.forEach((d, i) => {
    const gx = margin.left + i * xBand + (xBand - groupWidth) / 2;
    d.values.forEach((v, j) => { const yy = y(Math.max(v,0)); const h = Math.abs(y(v)-zeroY); html += `<rect x="${gx+j*barWidth+2}" y="${v>=0?yy:zeroY}" width="${Math.max(3,barWidth-4)}" height="${Math.max(1,h)}" rx="2" fill="${options.colors?.[j] || ["#c7a45a","#2e7d5b"][j]}"/>`; });
    html += `<text x="${margin.left + i*xBand + xBand/2}" y="${height-24}" text-anchor="middle" class="axis-label">${d.label.length > 14 ? d.label.slice(0,13)+"…" : d.label}</text>`;
  });
  return html + `</svg>`;
}

function renderBusinessChart(rows) {
  const active = rows.filter(x => x.active);
  $("#businessChart").innerHTML = svgBarChart(active.map(x => ({ label: x.name, values: [x.sales, x.ebitda] })), { width: 820, height: 330, colors: ["#c7a45a", "#2e7d5b"] });
}
function renderScenarioChart(rows) {
  $("#scenarioChart").innerHTML = svgBarChart(rows.map(x => ({ label: x.name, values: [x.ebitda] })), { width: 430, height: 210, colors: ["#213c61"] });
}
function renderInvestmentChart(r) {
  const data = [
    { label: "Locales y base", value: r.baseInvestment, color: "#14253d" },
    { label: "Deporte", value: state.businesses.filter(x => x.active && x.group === "Deporte").reduce((a,x)=>a+x.capex,0), color: "#c7a45a" },
    { label: "Franquicias", value: state.businesses.filter(x => x.active && x.group.startsWith("Franquicia")).reduce((a,x)=>a+x.capex,0), color: "#2e7d5b" },
    { label: "Comercial propio", value: state.businesses.filter(x => x.active && x.group === "Comercial propio").reduce((a,x)=>a+x.capex,0), color: "#7895b5" },
  ].filter(x => x.value > 0);
  let start = 0;
  const stops = data.map(x => { const p = r.investment ? x.value/r.investment*100 : 0; const s = `${x.color} ${start}% ${start+p}%`; start += p; return s; }).join(",");
  $("#investmentChart").innerHTML = `<div class="donut" style="background:conic-gradient(${stops})"><div class="donut-center"><strong>${fmtMoney(r.investment,true)}</strong><span>inversión total</span></div></div><div class="donut-legend">${data.map(x=>`<div><i style="background:${x.color}"></i><span>${x.label}</span><strong>${fmtPct(x.value/r.investment)}</strong></div>`).join("")}</div>`;
}
function renderFlowChart(flow) {
  const width=640,height=290,m={top:22,right:20,bottom:38,left:65};
  const values=flow.flatMap(x=>[x.net,x.cumulative]), min=Math.min(...values), max=Math.max(...values,0), range=max-min||1;
  const x=i=>m.left+i*(width-m.left-m.right)/(flow.length-1), y=v=>m.top+(max-v)/range*(height-m.top-m.bottom);
  const net=flow.map((d,i)=>`${x(i)},${y(d.net)}`).join(" "), cum=flow.map((d,i)=>`${x(i)},${y(d.cumulative)}`).join(" ");
  let grid=""; for(let i=0;i<=4;i++){const v=min+range*i/4,yy=y(v);grid+=`<line x1="${m.left}" y1="${yy}" x2="${width-m.right}" y2="${yy}" class="grid-line"/><text x="${m.left-8}" y="${yy+3}" text-anchor="end" class="axis-label">${fmtMoney(v,true)}</text>`;}
  const labels=flow.map((d,i)=>`<text x="${x(i)}" y="${height-14}" text-anchor="middle" class="axis-label">${d.year}</text>`).join("");
  $("#flowChart").innerHTML=`<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">${grid}<line x1="${m.left}" y1="${y(0)}" x2="${width-m.right}" y2="${y(0)}" class="zero-line"/><polyline points="${net}" fill="none" stroke="#c7a45a" stroke-width="3"/><polyline points="${cum}" fill="none" stroke="#213c61" stroke-width="3"/>${labels}</svg>`;
}

function refresh({ controls = false } = {}) { if (controls) renderControls(); renderDashboard(); }
function showToast(message) { const el=$("#toast"); el.textContent=message; el.classList.add("show"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>el.classList.remove("show"),2200); }

document.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-tab]");
  if (tab) { document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===tab)); document.querySelectorAll(".tab-panel").forEach(x=>x.classList.toggle("active",x.id===`tab-${tab.dataset.tab}`)); }
  const head = event.target.closest("[data-open-business]");
  if (head && !event.target.closest("[data-toggle-business]")) { openBusiness = openBusiness === head.dataset.openBusiness ? "" : head.dataset.openBusiness; renderControls(); }
  const toggleB = event.target.closest("[data-toggle-business]");
  if (toggleB) { event.preventDefault(); event.stopPropagation(); const i=+toggleB.dataset.toggleBusiness; state.businesses[i].active=!state.businesses[i].active; refresh({controls:true}); }
  const toggleI = event.target.closest("[data-toggle-investment]");
  if (toggleI) { const i=+toggleI.dataset.toggleInvestment; state.investments[i].active=!state.investments[i].active; refresh({controls:true}); }
});

document.addEventListener("input", (event) => {
  const input = event.target;
  if (input.matches(".linked-range, .linked-number")) {
    let value = Number(input.value); if (input.dataset.kind === "percent") value /= 100;
    setPath(input.dataset.path, value);
    document.querySelectorAll(`[data-path="${input.dataset.path}"]`).forEach(el => { if (el !== input) el.value = input.value; });
    renderDashboard();
  }
  if (input.matches("[data-scenario]")) { state.scenarios[input.dataset.scenario][input.dataset.scenarioKey]=Number(input.value)/100; renderDashboard(); }
});

$("#scenarioSelect").addEventListener("change", e => { state.scenario=e.target.value; renderDashboard(); });
$("#presentBtn").addEventListener("click", () => { document.body.classList.toggle("presentation"); $("#presentBtn").textContent=document.body.classList.contains("presentation")?"Volver a edición":"Modo presentación"; });
$("#printBtn").addEventListener("click", () => window.print());
$("#resetBtn").addEventListener("click", () => { state=cloneDefaults(); openBusiness="gym"; refresh({controls:true}); showToast("Valores de ejemplo restablecidos"); });
$("#saveBtn").addEventListener("click", () => { localStorage.setItem("tequixquiac-sim",JSON.stringify(state)); showToast("Escenario guardado en este dispositivo"); });

async function initialize() {
  try {
    const response = await fetch("https://tequixquiac-simulador-financiero.saltydegu6.chatgpt.site/api/config", { cache: "no-store" });
    if (response.ok) {
      defaults = await response.json();
      state = structuredClone(defaults);
    }
  } catch {}
  try {
    const saved=localStorage.getItem("tequixquiac-sim");
    if(saved) state=JSON.parse(saved);
  } catch {}
  renderControls();
  renderDashboard();
}

initialize();
