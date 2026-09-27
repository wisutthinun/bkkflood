/**
 * Main Application Logic
 * Flood & Traffic Command Center Dashboard (กทม. นนทบุรี ปทุมธานี)
 */

// Global State
let dashboardState = {
  data: JSON.parse(JSON.stringify(INITIAL_DATA)),
  lastUpdated: new Date(),
  autoRefreshInterval: null,
  activeFilterProvince: "all",
  activeFilterSeverity: "all",
  searchKeyword: "",
  activeTab: "overview",
  mapInstance: null,
  mapMarkers: [],
  trendChartInstance: null,
  cctvAnimFrames: {},
  activeModalCctvId: null
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initTimestamp();
  initEventListeners();
  renderDashboard();
  initMap();
  initTrendChart();
  startCctvRenderLoops();
  setupAutoRefresh(30); // Default 30s auto-refresh
});

// ==========================================================================
// Timestamp & Refresh Logic
// ==========================================================================
function formatThaiDateTime(date) {
  const monthsThai = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  const d = date.getDate();
  const m = monthsThai[date.getMonth()];
  const y = date.getFullYear() + 543; // Buddhist Era
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${d} ${m} ${y}, ${hh}:${mm}:${ss} น.`;
}

function initTimestamp() {
  updateTimestampDisplay();
}

function updateTimestampDisplay() {
  const el = document.getElementById("last-updated-val");
  if (el) {
    el.innerText = formatThaiDateTime(dashboardState.lastUpdated);
  }
}

function triggerManualRefresh() {
  const btn = document.getElementById("btn-manual-refresh");
  if (btn) btn.classList.add("spinning");

  // Simulate realistic network sync & slight water level fluctuation
  setTimeout(() => {
    dashboardState.lastUpdated = new Date();
    updateTimestampDisplay();
    simulateDataFluctuation();
    renderDashboard();
    updateMapMarkers();
    updateTrendChart();

    if (btn) btn.classList.remove("spinning");
    showNotification("อัปเดตข้อมูลระดับน้ำและกล้อง CCTV เรียบร้อยแล้ว");
  }, 650);
}

function simulateDataFluctuation() {
  // Add small micro-fluctuations to road water depth and canal levels
  dashboardState.data.canals.forEach(c => {
    const delta = (Math.random() * 0.04 - 0.02); // -0.02 to +0.02
    c.currentLevel = parseFloat(Math.max(0, c.currentLevel + delta).toFixed(2));
    c.capacityPercent = Math.min(100, Math.round((c.currentLevel / c.criticalLevel) * 100));
  });

  dashboardState.data.roads.forEach(r => {
    if (r.floodDepth > 0) {
      const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, +1 cm
      r.floodDepth = Math.max(0, r.floodDepth + delta);
    }
  });

  dashboardState.data.priorityZones.forEach(z => {
    const delta = Math.floor(Math.random() * 3) - 1;
    z.roadFloodLevel = Math.max(0, z.roadFloodLevel + delta);

    // Update rainfall stats if currently raining
    if (z.rainfall && z.rainfall.isRaining) {
      const rainDelta = parseFloat((Math.random() * 0.4 + 0.1).toFixed(1));
      z.rainfall.accumulated24h = parseFloat((z.rainfall.accumulated24h + rainDelta).toFixed(1));
      z.rainfall.durationMinutes += 1;
      const hours = Math.floor(z.rainfall.durationMinutes / 60);
      const mins = z.rainfall.durationMinutes % 60;
      z.rainfall.durationText = `ตกมาแล้ว ${hours > 0 ? `${hours} ชม. ` : ''}${mins} นาที`;
    }
  });
}

function setupAutoRefresh(seconds) {
  if (dashboardState.autoRefreshInterval) {
    clearInterval(dashboardState.autoRefreshInterval);
    dashboardState.autoRefreshInterval = null;
  }

  if (seconds > 0) {
    dashboardState.autoRefreshInterval = setInterval(() => {
      triggerManualRefresh();
    }, seconds * 1000);
  }
}

function showNotification(msg) {
  let toast = document.getElementById("dashboard-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "dashboard-toast";
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.background = "linear-gradient(135deg, #0284c7, #2563eb)";
    toast.style.color = "#fff";
    toast.style.padding = "10px 18px";
    toast.style.borderRadius = "10px";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
    toast.style.fontSize = "0.85rem";
    toast.style.fontWeight = "600";
    toast.style.zIndex = "9999";
    toast.style.transition = "opacity 0.3s, transform 0.3s";
    document.body.appendChild(toast);
  }
  toast.innerText = `🔄 ${msg}`;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
  }, 2500);
}

// ==========================================================================
// Event Listeners
// ==========================================================================
function initEventListeners() {
  // Manual refresh button
  const refreshBtn = document.getElementById("btn-manual-refresh");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", triggerManualRefresh);
  }

  // Auto refresh select
  const autoSelect = document.getElementById("auto-refresh-select");
  if (autoSelect) {
    autoSelect.addEventListener("change", (e) => {
      const val = parseInt(e.target.value, 10);
      setupAutoRefresh(val);
      showNotification(`ตั้งค่าอัปเดตอัตโนมัติ: ${val === 0 ? "ปิด" : `ทุก ${val} วินาที`}`);
    });
  }

  // Navigation tabs
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      const target = e.currentTarget;
      target.classList.add("active");
      const tabKey = target.getAttribute("data-tab");
      dashboardState.activeTab = tabKey;
      switchTab(tabKey);
    });
  });

  // Province filter
  const provSelect = document.getElementById("filter-province");
  if (provSelect) {
    provSelect.addEventListener("change", (e) => {
      dashboardState.activeFilterProvince = e.target.value;
      renderDashboard();
      updateMapMarkers();
    });
  }

  // Severity filter
  const sevSelect = document.getElementById("filter-severity");
  if (sevSelect) {
    sevSelect.addEventListener("change", (e) => {
      dashboardState.activeFilterSeverity = e.target.value;
      renderDashboard();
    });
  }

  // Search input
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      dashboardState.searchKeyword = e.target.value.trim().toLowerCase();
      renderDashboard();
    });
  }

  // Modal Close
  const modalClose = document.getElementById("modal-cctv-close");
  const modalOverlay = document.getElementById("modal-cctv");
  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

function switchTab(tabKey) {
  document.querySelectorAll(".section-panel").forEach(panel => {
    panel.classList.remove("active");
  });

  if (tabKey === "overview") {
    // Show all major panels
    document.querySelectorAll(".section-panel").forEach(panel => {
      panel.classList.add("active");
    });
  } else {
    const targetPanel = document.getElementById(`panel-${tabKey}`);
    if (targetPanel) {
      targetPanel.classList.add("active");
    }
  }

  // Resize Leaflet map if map section became visible
  if (dashboardState.mapInstance) {
    setTimeout(() => {
      dashboardState.mapInstance.invalidateSize();
    }, 200);
  }
}

// ==========================================================================
// Dashboard Renderers
// ==========================================================================
function renderDashboard() {
  renderSummaryMetrics();
  renderTopPriorityZones();
  renderCanals();
  renderRoads();
  renderCctvList();
}

function renderSummaryMetrics() {
  const canals = dashboardState.data.canals;
  const roads = dashboardState.data.roads;
  const cctvs = dashboardState.data.cctvList;
  const zones = dashboardState.data.priorityZones;

  const criticalRoads = roads.filter(r => r.severity === "critical").length;
  const warningRoads = roads.filter(r => r.severity === "moderate" || r.severity === "minor").length;
  const criticalCanals = canals.filter(c => c.status === "critical").length;
  const activeCctvs = cctvs.filter(c => c.status === "online").length;

  const maxRain = Math.max(...zones.map(z => z.rainfall ? z.rainfall.accumulated24h : 0));
  const rainingZones = zones.filter(z => z.rainfall && z.rainfall.isRaining);

  const elCritRoad = document.getElementById("metric-critical-roads");
  if (elCritRoad) elCritRoad.innerText = `${criticalRoads} จุด`;

  const elWarnRoad = document.getElementById("metric-warning-roads");
  if (elWarnRoad) elWarnRoad.innerText = `${warningRoads} จุด`;

  const elCritCanal = document.getElementById("metric-critical-canals");
  if (elCritCanal) elCritCanal.innerText = `${criticalCanals} สถานี`;

  const elCctv = document.getElementById("metric-active-cctv");
  if (elCctv) elCctv.innerText = `${activeCctvs} กล้อง`;

  const elMaxRain = document.getElementById("metric-max-rain");
  if (elMaxRain) elMaxRain.innerText = `${maxRain.toFixed(1)} มม.`;

  const elRainStatus = document.getElementById("metric-rain-status");
  if (elRainStatus) {
    elRainStatus.innerText = `${rainingZones.length} ใน ${zones.length} โซนหลักยังมีฝนตก`;
  }
}

// --------------------------------------------------------------------------
// TOP PINNED PRIORITY ZONES (งามวงศ์วาน, ประชาชื่น, แจ้งวัฒนะ, ม.เกษตร)
// --------------------------------------------------------------------------
function renderTopPriorityZones() {
  const container = document.getElementById("priority-zones-grid");
  if (!container) return;

  const zones = dashboardState.data.priorityZones;

  container.innerHTML = zones.map(zone => {
    const isCritical = zone.status === "critical";
    const badgeClass = isCritical ? "critical" : "warning";
    const badgeText = isCritical ? "วิกฤตล้นตลิ่ง/ท่วมสูง" : "เฝ้าระวังน้ำท่วมขัง";
    const statusColor = isCritical ? "text-critical" : "text-warning";
    const rain = zone.rainfall;

    return `
      <div class="priority-card ${isCritical ? 'is-critical' : 'is-warning'}">
        <div class="zone-top-info">
          <div>
            <div class="zone-name">${zone.name}</div>
            <div class="zone-province">${zone.province} • ${zone.keyLocation}</div>
          </div>
          <span class="zone-badge ${badgeClass}">${badgeText}</span>
        </div>

        <div class="zone-metrics-strip">
          <div class="metric-strip-item">
            <div class="strip-label">
              <span>🌊 ระดับน้ำถนน</span>
            </div>
            <div class="strip-val ${statusColor}">
              ${zone.roadFloodLevel} <span style="font-size: 0.72rem; font-weight: normal;">ซม.</span>
            </div>
          </div>
          <div class="metric-strip-item">
            <div class="strip-label">
              <span>🛶 ระดับน้ำคลอง</span>
            </div>
            <div class="strip-val" style="color: #38bdf8;">
              ${zone.canalLevel} <span style="font-size: 0.72rem; font-weight: normal;">ม. (${zone.canalCapacityPercent}%)</span>
            </div>
          </div>
          <div class="metric-strip-item">
            <div class="strip-label">
              <span>🌧️ ฝนสะสม 24 ชม.</span>
            </div>
            <div class="strip-val text-rain">
              ${rain ? rain.accumulated24h : 0} <span style="font-size: 0.72rem; font-weight: normal;">มม.</span>
            </div>
          </div>
        </div>

        <!-- Rain Status Detail Banner -->
        ${rain ? `
          <div class="zone-rain-detail-banner">
            <div class="rain-banner-head">
              <span class="rain-status-pill ${rain.isRaining ? 'raining' : 'stopped'}">
                ${rain.isRaining ? '🌧️ กำลังตก' : '⛅ ฝนหยุดแล้ว'}: ${rain.intensity}
              </span>
              <span class="rain-time-text">
                ${rain.isRaining 
                  ? `⏱️ ${rain.durationText} (เริ่มตก ${rain.startTime})` 
                  : `⏱️ หยุดตกเมื่อเวลา ${rain.stoppedTime} (${rain.durationText})`}
              </span>
            </div>
            <div class="rain-forecast-text">
              <span>📡 <strong>เรดาร์ตรวจสภาพ:</strong> ${rain.radarForecast}</span>
            </div>
          </div>
        ` : ''}

        <!-- Live CCTV Stream Frame -->
        <div class="zone-cctv-preview" id="preview-wrap-${zone.cctvId}">
          <canvas id="canvas-${zone.cctvId}" width="400" height="200"></canvas>
          <div class="cctv-osd-top">
            <span class="cctv-rec-pill">LIVE REC</span>
            <span>${zone.cctvName}</span>
          </div>
          <div class="cctv-osd-bottom">
            <span class="live-clock-tick" id="clock-${zone.cctvId}">--:--:--</span>
            <button class="btn-cctv-expand" onclick="openCctvModal('${zone.cctvId}')">⛶ ขยายดูสด</button>
          </div>
        </div>

        <div class="zone-advice-box">
          <strong>⚠️ สภาพเส้นทาง:</strong> ${zone.roadCondition}
          <div style="margin-top: 4px; color: #94a3b8;"><strong>💡 คำแนะนำ:</strong> ${zone.advice}</div>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// Canal Water Levels
// --------------------------------------------------------------------------
function renderCanals() {
  const container = document.getElementById("canals-list");
  if (!container) return;

  const keyword = dashboardState.searchKeyword;
  const prov = dashboardState.activeFilterProvince;

  const filtered = dashboardState.data.canals.filter(c => {
    const matchKeyword = !keyword || c.name.toLowerCase().includes(keyword) || c.station.toLowerCase().includes(keyword) || c.zone.toLowerCase().includes(keyword);
    const matchProv = prov === "all" || c.province.includes(prov);
    return matchKeyword && matchProv;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">ไม่พบข้อมูลคลองที่ตรงกับเงื่อนไขการค้นหา</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    let gaugeClass = "normal";
    let statusBadgeColor = "rgba(16, 185, 129, 0.2)";
    let statusTextColor = "#34d399";

    if (c.status === "critical") {
      gaugeClass = "critical";
      statusBadgeColor = "rgba(239, 68, 68, 0.2)";
      statusTextColor = "#f87171";
    } else if (c.status === "warning") {
      gaugeClass = "warning";
      statusBadgeColor = "rgba(245, 158, 11, 0.2)";
      statusTextColor = "#fbbf24";
    } else if (c.status === "watch") {
      gaugeClass = "watch";
      statusBadgeColor = "rgba(14, 165, 233, 0.2)";
      statusTextColor = "#38bdf8";
    }

    const trendIcon = c.trend === "up" ? "🔺 เพิ่มขึ้น" : c.trend === "down" ? "🔻 ลดลง" : "➡️ ทรงตัว";

    return `
      <div class="canal-card">
        <div class="canal-card-head">
          <div>
            <div class="canal-name">${c.name}</div>
            <div class="canal-station">${c.station}</div>
            <div style="font-size: 0.72rem; color: #0284c7; margin-top: 2px;">📍 ${c.zone} (${c.province})</div>
          </div>
          <span style="font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: ${statusBadgeColor}; color: ${statusTextColor}; border: 1px solid ${statusTextColor};">
            ${c.statusLabel}
          </span>
        </div>

        <div class="canal-level-display">
          <span class="level-number" style="color: ${statusTextColor};">${c.currentLevel.toFixed(2)}</span>
          <span class="level-unit">ม.รทก.</span>
          <span style="font-size: 0.75rem; color: #94a3b8; margin-left: auto;">แนวโน้ม: <strong>${trendIcon}</strong></span>
        </div>

        <div class="gauge-container">
          <div class="gauge-bar-wrapper">
            <div class="gauge-bar-fill ${gaugeClass}" style="width: ${Math.min(100, c.capacityPercent)}%;"></div>
          </div>
          <div class="gauge-threshold-markers">
            <span>เตือนภัย: ${c.warningLevel.toFixed(2)} ม.</span>
            <span><strong>${c.capacityPercent}% ความจุคลอง</strong></span>
            <span>วิกฤต: ${c.criticalLevel.toFixed(2)} ม.</span>
          </div>
        </div>

        <div class="canal-details-list">
          <div class="canal-detail-row">
            <span>การระบาย / เดินเครื่อง:</span>
            <span class="val">${c.flowRate}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// Road Flooding Levels
// --------------------------------------------------------------------------
function renderRoads() {
  const container = document.getElementById("roads-list");
  if (!container) return;

  const keyword = dashboardState.searchKeyword;
  const prov = dashboardState.activeFilterProvince;
  const sev = dashboardState.activeFilterSeverity;

  const filtered = dashboardState.data.roads.filter(r => {
    const matchKeyword = !keyword || r.roadName.toLowerCase().includes(keyword) || r.location.toLowerCase().includes(keyword) || r.zone.toLowerCase().includes(keyword);
    const matchProv = prov === "all" || r.province.includes(prov);
    const matchSev = sev === "all" || r.severity === sev;
    return matchKeyword && matchProv && matchSev;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">ไม่พบข้อมูลถนนที่ตรงกับเงื่อนไขการค้นหา</div>`;
    return;
  }

  container.innerHTML = filtered.map(r => {
    return `
      <div class="road-card ${r.severity}">
        <div class="road-card-head">
          <div>
            <div class="road-name">${r.roadName}</div>
            <div class="road-location">${r.location}</div>
            <div style="font-size: 0.72rem; color: #0284c7; margin-top: 2px;">📍 ${r.zone} (${r.province})</div>
          </div>
          <span style="font-size: 0.72rem; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.08);">
            ${r.severityLabel}
          </span>
        </div>

        <div class="road-flood-indicator">
          <div class="flood-depth-box">
            <span class="flood-depth-val ${r.severity}">${r.floodDepth}</span>
            <span class="flood-depth-unit">ซม. (ความสูงน้ำ)</span>
          </div>
          <div class="vehicle-advice-pill ${r.severity}">
            ${r.vehicleAdvice}
          </div>
        </div>

        <div class="road-detail-text">
          <div><strong>ช่องทางที่ท่วม:</strong> ${r.affectedLanes}</div>
          <div style="margin-top: 2px;"><strong>สาเหตุ:</strong> ${r.cause}</div>
        </div>

        <div class="road-pumps-status">
          <span>🌀 ${r.drainageStatus}</span>
        </div>
      </div>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// CCTV List
// --------------------------------------------------------------------------
function renderCctvList() {
  const container = document.getElementById("cctv-list");
  if (!container) return;

  const keyword = dashboardState.searchKeyword;
  const prov = dashboardState.activeFilterProvince;

  const filtered = dashboardState.data.cctvList.filter(c => {
    const matchKeyword = !keyword || c.name.toLowerCase().includes(keyword) || c.road.toLowerCase().includes(keyword) || c.zone.toLowerCase().includes(keyword);
    const matchProv = prov === "all" || c.province.includes(prov);
    return matchKeyword && matchProv;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #94a3b8;">ไม่พบกล้อง CCTV ที่ตรงกับเงื่อนไขการค้นหา</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => {
    return `
      <div class="cctv-card">
        <div class="cctv-viewport">
          <canvas id="canvas-${c.id}" width="400" height="220"></canvas>
          <div class="cctv-osd-top">
            <span class="cctv-rec-pill">LIVE 30FPS</span>
            <span>CAM: ${c.id}</span>
          </div>
          <div class="cctv-osd-bottom">
            <span id="clock-${c.id}">--:--:--</span>
            <button class="btn-cctv-expand" onclick="openCctvModal('${c.id}')">⛶ ขยายเต็มจอ</button>
          </div>
        </div>

        <div class="cctv-card-info">
          <div class="cctv-card-title-row">
            <div class="cctv-name">${c.name}</div>
            <span class="cctv-zone-tag">${c.zone}</span>
          </div>
          <div class="cctv-desc">
            <div><strong>จุดติดตั้ง:</strong> ${c.road} (${c.direction})</div>
            <div><strong>การจราจร:</strong> ${c.vehicleDensity}</div>
          </div>
          <div class="cctv-status-row">
            <span>สถานะผิวทาง: 
              <strong style="color: ${c.hasFlood ? '#f87171' : '#34d399'};">
                ${c.hasFlood ? `มีน้ำท่วมขัง ${c.floodLevelCm} ซม.` : 'แห้งปกติ'}
              </strong>
            </span>
            <span style="color: #34d399;">🟢 ONLINE</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================================================
// Realistic CCTV Stream Canvas Engine
// ==========================================================================
// Simulates live traffic video, lane markings, rain, vehicles, and flood puddles
class TrafficSimulation {
  constructor(canvasId, cameraMeta) {
    this.canvasId = canvasId;
    this.meta = cameraMeta;
    this.vehicles = [];
    this.raindrops = [];
    this.lastFrameTime = performance.now();
    this.init();
  }

  init() {
    // Check if camera belongs to a zone with rain data
    const zone = dashboardState.data.priorityZones.find(z => z.cctvId === this.meta.id || z.cctvSecondaryId === this.meta.id);
    const isRaining = zone ? (zone.rainfall ? zone.rainfall.isRaining : false) : this.meta.hasFlood;
    const intensity = zone && zone.rainfall ? zone.rainfall.intensityLevel : (this.meta.hasFlood ? 'moderate' : 'none');

    // Generate vehicles
    const numVehicles = this.meta.hasFlood ? 8 : 12;
    for (let i = 0; i < numVehicles; i++) {
      this.vehicles.push({
        x: Math.random() * 400,
        y: 80 + Math.random() * 95,
        speed: (this.meta.hasFlood ? 0.4 : 1.2) + Math.random() * (this.meta.hasFlood ? 0.6 : 1.5),
        color: ['#ffffff', '#3b82f6', '#ef4444', '#e2e8f0', '#f59e0b', '#10b981'][Math.floor(Math.random() * 6)],
        type: Math.random() > 0.7 ? 'bus' : (Math.random() > 0.4 ? 'car' : 'moto'),
        direction: Math.random() > 0.5 ? 1 : -1
      });
    }

    // Generate raindrops matching real rain intensity
    let numDrops = 0;
    if (isRaining) {
      if (intensity === 'heavy') numDrops = 75;
      else if (intensity === 'moderate') numDrops = 40;
      else if (intensity === 'light') numDrops = 15;
    }

    for (let i = 0; i < numDrops; i++) {
      this.raindrops.push({
        x: Math.random() * 400,
        y: Math.random() * 220,
        len: (intensity === 'heavy' ? 12 : 8) + Math.random() * 8,
        speed: 10 + Math.random() * 8
      });
    }
  }

  draw(ctx, width, height) {
    // 1. Draw Road Background & Sky/Buildings
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, width, height * 0.4);

    // Distant city silhouette
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, height * 0.22, 45, height * 0.18);
    ctx.fillRect(80, height * 0.15, 60, height * 0.25);
    ctx.fillRect(180, height * 0.20, 50, height * 0.20);
    ctx.fillRect(260, height * 0.12, 70, height * 0.28);
    ctx.fillRect(350, height * 0.25, 40, height * 0.15);

    // Overpass or skyway bridge if applicable
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, height * 0.36, width, 12);
    ctx.fillStyle = '#475569';
    ctx.fillRect(width * 0.25, height * 0.36, 16, height * 0.64);
    ctx.fillRect(width * 0.75, height * 0.36, 16, height * 0.64);

    // Asphalt Road
    ctx.fillStyle = '#181e29';
    ctx.fillRect(0, height * 0.42, width, height * 0.58);

    // Lane Dividers (Dashed yellow/white lines)
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(0, height * 0.62);
    ctx.lineTo(width, height * 0.62);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.82);
    ctx.lineTo(width, height * 0.82);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // 2. Draw Flood Water Overlay if hasFlood
    if (this.meta.hasFlood) {
      const floodHeight = height * 0.35;
      const gradient = ctx.createLinearGradient(0, height - floodHeight, 0, height);
      gradient.addColorStop(0, 'rgba(30, 58, 138, 0.2)');
      gradient.addColorStop(0.5, 'rgba(14, 116, 144, 0.45)');
      gradient.addColorStop(1, 'rgba(8, 47, 73, 0.7)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - floodHeight, width, floodHeight);

      // Water ripples
      const time = performance.now() * 0.002;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const rippleY = height - 20 - i * 18 + Math.sin(time + i) * 3;
        ctx.beginPath();
        ctx.moveTo(10, rippleY);
        ctx.quadraticCurveTo(width * 0.5, rippleY + 4, width - 10, rippleY);
        ctx.stroke();
      }
    }

    // 3. Draw Moving Vehicles
    this.vehicles.forEach(v => {
      v.x += v.speed * v.direction;
      if (v.direction === 1 && v.x > width + 40) v.x = -40;
      if (v.direction === -1 && v.x < -40) v.x = width + 40;

      // Draw vehicle body
      ctx.fillStyle = v.color;
      let vWidth = v.type === 'bus' ? 44 : (v.type === 'moto' ? 14 : 26);
      let vHeight = v.type === 'bus' ? 18 : (v.type === 'moto' ? 8 : 12);

      ctx.fillRect(v.x, v.y, vWidth, vHeight);

      // Headlights / Taillights
      if (v.direction === 1) {
        // Taillights red
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.fillRect(v.x, v.y + 2, 3, vHeight - 4);
        // Headlights white beam
        ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
        ctx.fillRect(v.x + vWidth - 3, v.y + 2, 3, vHeight - 4);

        ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
        ctx.beginPath();
        ctx.moveTo(v.x + vWidth, v.y);
        ctx.lineTo(v.x + vWidth + 30, v.y - 6);
        ctx.lineTo(v.x + vWidth + 30, v.y + vHeight + 6);
        ctx.closePath();
        ctx.fill();
      } else {
        // Headlights white left
        ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
        ctx.fillRect(v.x, v.y + 2, 3, vHeight - 4);
        // Taillights red right
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.fillRect(v.x + vWidth - 3, v.y + 2, 3, vHeight - 4);

        ctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
        ctx.beginPath();
        ctx.moveTo(v.x, v.y);
        ctx.lineTo(v.x - 30, v.y - 6);
        ctx.lineTo(v.x - 30, v.y + vHeight + 6);
        ctx.closePath();
        ctx.fill();
      }

      // Water splash under tires in flooded zones
      if (this.meta.hasFlood && v.y > height * 0.65) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(v.x - 4, v.y + vHeight - 2, 8, 3);
        ctx.fillRect(v.x + vWidth - 4, v.y + vHeight - 2, 8, 3);
      }
    });

    // 4. Raindrops
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    this.raindrops.forEach(drop => {
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x - 2, drop.y + drop.len);
      ctx.stroke();

      drop.y += drop.speed;
      drop.x -= 1;
      if (drop.y > height) {
        drop.y = -10;
        drop.x = Math.random() * width;
      }
    });

    // 5. Camera Scanline effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 1.5);
    }
  }
}

const activeSimulations = {};

function startCctvRenderLoops() {
  const allCameras = dashboardState.data.cctvList;

  allCameras.forEach(cam => {
    activeSimulations[cam.id] = new TrafficSimulation(cam.id, cam);
  });

  function renderLoop() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const clockStr = `${hh}:${mm}:${ss}`;

    // Update all matching canvas elements in DOM (both priority and cctv grid)
    allCameras.forEach(cam => {
      const canvases = document.querySelectorAll(`canvas[id="canvas-${cam.id}"]`);
      canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (ctx && activeSimulations[cam.id]) {
          activeSimulations[cam.id].draw(ctx, canvas.width, canvas.height);
        }
      });

      // Update OSD Clock
      const clocks = document.querySelectorAll(`span[id="clock-${cam.id}"]`);
      clocks.forEach(c => {
        c.innerText = clockStr;
      });
    });

    // Modal canvas if active
    if (dashboardState.activeModalCctvId) {
      const modalCanvas = document.getElementById("modal-cctv-canvas");
      if (modalCanvas && activeSimulations[dashboardState.activeModalCctvId]) {
        const ctx = modalCanvas.getContext('2d');
        if (ctx) {
          activeSimulations[dashboardState.activeModalCctvId].draw(ctx, modalCanvas.width, modalCanvas.height);
        }
        const modalClock = document.getElementById("modal-cctv-clock");
        if (modalClock) modalClock.innerText = clockStr;
      }
    }

    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);
}

// ==========================================================================
// CCTV Modal
// ==========================================================================
function openCctvModal(cctvId) {
  const cam = dashboardState.data.cctvList.find(c => c.id === cctvId);
  if (!cam) return;

  dashboardState.activeModalCctvId = cctvId;

  const modal = document.getElementById("modal-cctv");
  const modalTitle = document.getElementById("modal-cctv-title");
  const modalInfo = document.getElementById("modal-cctv-info");

  if (modalTitle) modalTitle.innerText = `📹 กล้องสด: ${cam.name} (${cam.zone})`;
  if (modalInfo) {
    modalInfo.innerHTML = `
      <span>📍 <strong>ตำแหน่ง:</strong> ${cam.road}</span> • 
      <span>🚗 <strong>สภาพการจราจร:</strong> ${cam.vehicleDensity}</span> • 
      <span>🌊 <strong>น้ำท่วมขัง:</strong> ${cam.hasFlood ? `${cam.floodLevelCm} ซม.` : 'ไม่มีน้ำท่วมขัง'}</span>
    `;
  }

  if (modal) modal.classList.add("active");
}

function closeModal() {
  const modal = document.getElementById("modal-cctv");
  if (modal) modal.classList.remove("active");
  dashboardState.activeModalCctvId = null;
}

// ==========================================================================
// Interactive Map (Leaflet)
// ==========================================================================
function initMap() {
  const mapEl = document.getElementById("map-container");
  if (!mapEl || typeof L === 'undefined') return;

  // Center around Bangkok / Nonthaburi / Pathum Thani (Chaengwattana / Ngamwongwan coordinate)
  const map = L.map('map-container').setView([13.865, 100.55], 11);
  dashboardState.mapInstance = map;

  // Modern Dark Basemap
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 18
  }).addTo(map);

  updateMapMarkers();
}

function updateMapMarkers() {
  if (!dashboardState.mapInstance || typeof L === 'undefined') return;
  const map = dashboardState.mapInstance;

  // Clear existing markers
  dashboardState.mapMarkers.forEach(m => map.removeLayer(m));
  dashboardState.mapMarkers = [];

  const canals = dashboardState.data.canals;
  const roads = dashboardState.data.roads;
  const cctvs = dashboardState.data.cctvList;

  // Add Canal Markers (Blue/Red circle pulses)
  canals.forEach(c => {
    const isCrit = c.status === "critical";
    const color = isCrit ? "#ef4444" : (c.status === "warning" ? "#f59e0b" : "#0284c7");

    const marker = L.circleMarker(c.coordinates, {
      radius: isCrit ? 10 : 8,
      fillColor: color,
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: 'Prompt', sans-serif; color: #1e293b;">
        <h4 style="margin: 0; font-size: 14px; color: ${color};">🛶 ${c.name}</h4>
        <div style="font-size: 12px; margin-top: 4px;"><strong>สถานี:</strong> ${c.station}</div>
        <div style="font-size: 12px;"><strong>ระดับน้ำ:</strong> ${c.currentLevel} ม.รทก. (${c.capacityPercent}%)</div>
        <div style="font-size: 12px;"><strong>สถานะ:</strong> ${c.statusLabel}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${c.flowRate}</div>
      </div>
    `);

    dashboardState.mapMarkers.push(marker);
  });

  // Add Road Flood Markers
  roads.forEach(r => {
    if (r.floodDepth > 0) {
      const isCrit = r.severity === "critical";
      const marker = L.marker(r.coordinates, {
        icon: L.divIcon({
          className: 'custom-road-marker',
          html: `<div style="background: ${isCrit ? '#ef4444' : '#f59e0b'}; color: #fff; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">🌊</div>`,
          iconSize: [26, 26]
        })
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family: 'Prompt', sans-serif; color: #1e293b;">
          <h4 style="margin: 0; font-size: 14px; color: #ef4444;">🚨 ${r.roadName}</h4>
          <div style="font-size: 12px; margin-top: 4px;"><strong>จุดเกิดเหตุ:</strong> ${r.location}</div>
          <div style="font-size: 12px; color: #b91c1c;"><strong>ระดับน้ำท่วม:</strong> ${r.floodDepth} ซม. (${r.severityLabel})</div>
          <div style="font-size: 11px; margin-top: 4px;"><strong>คำแนะนำ:</strong> ${r.vehicleAdvice}</div>
        </div>
      `);

      dashboardState.mapMarkers.push(marker);
    }
  });

  // Add CCTV Camera Markers
  cctvs.forEach(cam => {
    const marker = L.marker(cam.coordinates, {
      icon: L.divIcon({
        className: 'custom-cctv-marker',
        html: `<div style="background: #10b981; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">📹</div>`,
        iconSize: [24, 24]
      })
    }).addTo(map);

    marker.bindPopup(`
      <div style="font-family: 'Prompt', sans-serif; color: #1e293b;">
        <h4 style="margin: 0; font-size: 13px; color: #0f766e;">📹 ${cam.name}</h4>
        <div style="font-size: 11px; margin-top: 2px;"><strong>ถนน:</strong> ${cam.road}</div>
        <div style="font-size: 11px;"><strong>การจราจร:</strong> ${cam.vehicleDensity}</div>
        <div style="font-size: 11px; color: ${cam.hasFlood ? '#ef4444' : '#10b981'};"><strong>น้ำท่วม:</strong> ${cam.hasFlood ? `${cam.floodLevelCm} ซม.` : 'ไม่มีน้ำท่วมขัง'}</div>
        <button onclick="openCctvModal('${cam.id}')" style="margin-top: 6px; background: #0284c7; color: #fff; border: none; border-radius: 4px; padding: 3px 8px; font-size: 11px; cursor: pointer; width: 100%;">เปิดกล้องสด</button>
      </div>
    `);

    dashboardState.mapMarkers.push(marker);
  });
}

// ==========================================================================
// Chart.js Historical Trend
// ==========================================================================
function initTrendChart() {
  const canvas = document.getElementById("trend-chart");
  if (!canvas || typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  const trends = dashboardState.data.historicalTrends;

  dashboardState.trendChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trends.timestamps,
      datasets: trends.series.map(s => ({
        label: s.name,
        data: s.levels,
        borderColor: s.color,
        backgroundColor: s.color + '22',
        borderWidth: 2,
        tension: 0.35,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 6
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: '#cbd5e1',
            font: { family: 'Prompt', size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.dataset.label}: ${context.parsed.y} ม.รทก.`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(56, 75, 112, 0.2)' },
          ticks: { color: '#94a3b8', font: { family: 'Prompt', size: 10 } }
        },
        y: {
          title: {
            display: true,
            text: 'ระดับน้ำ (ม.รทก.)',
            color: '#94a3b8',
            font: { family: 'Prompt', size: 11 }
          },
          grid: { color: 'rgba(56, 75, 112, 0.2)' },
          ticks: { color: '#94a3b8', font: { family: 'Prompt', size: 10 } }
        }
      }
    }
  });
}

function updateTrendChart() {
  if (dashboardState.trendChartInstance) {
    dashboardState.trendChartInstance.update();
  }
}
